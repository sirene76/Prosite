import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { createSlug } from "../utils";

type VersionUpdatePayload = {
  number?: unknown;
  changelog?: unknown;
  previewUrl?: unknown;
  previewVideo?: unknown;
  inlineHtml?: unknown;
  inlineCss?: unknown;
  inlineMeta?: unknown;
};

type UpdatePayload = {
  name?: unknown;
  slug?: unknown;
  category?: unknown;
  subcategory?: unknown;
  description?: unknown;
  tags?: unknown;
  currentVersion?: unknown;
  published?: unknown;
  featured?: unknown;
  thumbnail?: unknown;
  previewVideo?: unknown;
  versions?: unknown;
};

function normaliseTags(value: unknown) {
  if (!value) return undefined;
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
  return undefined;
}

function buildUpdates(body: UpdatePayload): Record<string, unknown> | { error: string; status: number } {
  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const trimmedName = body.name.trim();
    if (!trimmedName) {
      return { error: "Name is required", status: 400 };
    }

    updates.name = trimmedName;

    if (!body.slug) {
      const generatedSlug = createSlug(trimmedName);
      if (!generatedSlug) {
        return {
          error: "Name must include at least one alphanumeric character",
          status: 400,
        };
      }
      updates.slug = generatedSlug;
    }
  }

  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = createSlug(body.slug);
    if (!slug) {
      return {
        error: "Slug must include at least one alphanumeric character",
        status: 400,
      };
    }
    updates.slug = slug;
  }

  if (body.category !== undefined) {
    updates.category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : undefined;
  }

  if (body.subcategory !== undefined) {
    updates.subcategory =
      typeof body.subcategory === "string" && body.subcategory.trim()
        ? body.subcategory.trim()
        : undefined;
  }

  if (body.description !== undefined) {
    updates.description = typeof body.description === "string" ? body.description : "";
  }

  if (body.thumbnail !== undefined) {
    updates.thumbnail =
      typeof body.thumbnail === "string" && body.thumbnail.trim()
        ? body.thumbnail.trim()
        : undefined;
  }

  if (body.previewVideo !== undefined) {
    updates.previewVideo =
      typeof body.previewVideo === "string" && body.previewVideo.trim()
        ? body.previewVideo.trim()
        : undefined;
  }

  const tags = normaliseTags(body.tags);
  if (tags !== undefined) {
    updates.tags = tags;
  }

  if (typeof body.currentVersion === "string" && body.currentVersion.trim()) {
    updates.currentVersion = body.currentVersion.trim();
  }

  if (typeof body.published === "boolean") {
    updates.published = body.published;
  }

  if (typeof body.featured === "boolean") {
    updates.featured = body.featured;
  }

  return updates;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    const template = await Template.findById(id).lean();
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to fetch template ${id}`, error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    const body = (await request.json()) as UpdatePayload;
    const updates = buildUpdates(body);

    if ("error" in updates) {
      return NextResponse.json({ error: updates.error }, { status: updates.status });
    }

    const updated = await Template.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to update template ${id}`, error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    const body = (await request.json()) as UpdatePayload;
    const updates = buildUpdates(body);

    if ("error" in updates) {
      return NextResponse.json({ error: updates.error }, { status: updates.status });
    }

    if (Array.isArray(body.versions) && body.versions.length > 0) {
      const [firstVersion] = body.versions as VersionUpdatePayload[];
      const currentVersion =
        typeof updates.currentVersion === "string" && updates.currentVersion.trim()
          ? updates.currentVersion.trim()
          : typeof body.currentVersion === "string" && body.currentVersion.trim()
            ? body.currentVersion.trim()
            : typeof firstVersion?.number === "string" && firstVersion.number.trim()
              ? firstVersion.number.trim()
              : "1.0.0";

      updates.currentVersion = currentVersion;

      updates.versions = [
        {
          number: currentVersion,
          changelog: typeof firstVersion?.changelog === "string" ? firstVersion.changelog : "",
          previewUrl: typeof firstVersion?.previewUrl === "string" ? firstVersion.previewUrl : "",
          previewVideo:
            typeof firstVersion?.previewVideo === "string" ? firstVersion.previewVideo : "",
          inlineHtml: typeof firstVersion?.inlineHtml === "string" ? firstVersion.inlineHtml : "",
          inlineCss: typeof firstVersion?.inlineCss === "string" ? firstVersion.inlineCss : "",
          inlineMeta: typeof firstVersion?.inlineMeta === "string" ? firstVersion.inlineMeta : "",
        },
      ];
    }

    const updated = await Template.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to update template ${id}`, error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    await Template.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to delete template ${id}`, error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

function isCastError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "CastError");
}
