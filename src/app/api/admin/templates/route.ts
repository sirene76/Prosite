import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSlug } from "./utils";

export async function GET() {
  await connectDB();
  const templates = await Template.find().sort({ createdAt: -1 }).lean();

  const serialized = templates.map((template) => ({
    ...template,
    _id: template._id.toString(),
    createdAt:
      template.createdAt instanceof Date
        ? template.createdAt.toISOString()
        : template.createdAt,
    updatedAt:
      template.updatedAt instanceof Date
        ? template.updatedAt.toISOString()
        : template.updatedAt,
  }));

  return NextResponse.json(serialized);
}

type VersionInput = {
  number?: unknown;
  changelog?: unknown;
  htmlUrl?: unknown;
  cssUrl?: unknown;
  metaUrl?: unknown;
  previewUrl?: unknown;
  previewVideo?: unknown;
  inlineHtml?: unknown;
  inlineCss?: unknown;
  inlineMeta?: unknown;
};

function sanitiseVersion(version: VersionInput) {
  const number = typeof version.number === "string" ? version.number.trim() : "";
  if (!number) {
    throw new Error("Version number is required");
  }

  return {
    number,
    changelog: typeof version.changelog === "string" ? version.changelog : undefined,
    htmlUrl: typeof version.htmlUrl === "string" && version.htmlUrl.trim() ? version.htmlUrl.trim() : undefined,
    cssUrl: typeof version.cssUrl === "string" && version.cssUrl.trim() ? version.cssUrl.trim() : undefined,
    metaUrl: typeof version.metaUrl === "string" && version.metaUrl.trim() ? version.metaUrl.trim() : undefined,
    previewUrl:
      typeof version.previewUrl === "string" && version.previewUrl.trim()
        ? version.previewUrl.trim()
        : undefined,
    previewVideo:
      typeof version.previewVideo === "string" && version.previewVideo.trim()
        ? version.previewVideo.trim()
        : undefined,
    inlineHtml:
      typeof version.inlineHtml === "string" && version.inlineHtml.trim().length > 0
        ? version.inlineHtml
        : undefined,
    inlineCss:
      typeof version.inlineCss === "string" && version.inlineCss.trim().length > 0
        ? version.inlineCss
        : undefined,
    inlineMeta:
      typeof version.inlineMeta === "string" && version.inlineMeta.trim().length > 0
        ? version.inlineMeta
        : undefined,
  };
}

function sanitiseTags(value: unknown) {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

export async function POST(req: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slugSource =
      typeof body.slug === "string" && body.slug.trim().length > 0 ? body.slug.trim() : name;
    const slug = createSlug(slugSource);
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const versionInputs = Array.isArray(body.versions) ? (body.versions as VersionInput[]) : [];
    if (!versionInputs.length) {
      return NextResponse.json({ error: "At least one version is required" }, { status: 400 });
    }

    const versions = versionInputs.map(sanitiseVersion);

    const defaultVersionNumber = versions[versions.length - 1]?.number ?? "1.0.0";
    const currentVersion =
      typeof body.currentVersion === "string" && body.currentVersion.trim().length > 0
        ? body.currentVersion.trim()
        : defaultVersionNumber;

    const template = await Template.create({
      name,
      slug,
      description: typeof body.description === "string" ? body.description : undefined,
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : undefined,
      subcategory:
        typeof body.subcategory === "string" && body.subcategory.trim()
          ? body.subcategory.trim()
          : undefined,
      tags: sanitiseTags(body.tags),
      versions,
      currentVersion,
      published: typeof body.published === "boolean" ? body.published : false,
      featured: typeof body.featured === "boolean" ? body.featured : false,
      createdBy: session.user.id,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to create template", error);
    if (error instanceof Error && error.message === "Version number is required") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A template with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
