import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type VersionPayload = {
  number?: unknown;
  changelog?: unknown;
  htmlUrl?: unknown;
  cssUrl?: unknown;
  metaUrl?: unknown;
  previewUrl?: unknown;
  previewVideo?: unknown;
};

function sanitiseVersion(body: VersionPayload) {
  const number = typeof body.number === "string" ? body.number.trim() : "";
  if (!number) {
    throw new Error("Version number is required");
  }

  return {
    number,
    changelog: typeof body.changelog === "string" ? body.changelog : undefined,
    htmlUrl: typeof body.htmlUrl === "string" && body.htmlUrl.trim() ? body.htmlUrl.trim() : undefined,
    cssUrl: typeof body.cssUrl === "string" && body.cssUrl.trim() ? body.cssUrl.trim() : undefined,
    metaUrl: typeof body.metaUrl === "string" && body.metaUrl.trim() ? body.metaUrl.trim() : undefined,
    previewUrl:
      typeof body.previewUrl === "string" && body.previewUrl.trim()
        ? body.previewUrl.trim()
        : undefined,
    previewVideo:
      typeof body.previewVideo === "string" && body.previewVideo.trim()
        ? body.previewVideo.trim()
        : undefined,
  };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawBody = (await req.json()) as VersionPayload;
    const version = sanitiseVersion(rawBody);

    const template = await Template.findById(params.id);
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    template.versions.push(version);
    template.currentVersion = version.number;
    await template.save();

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof Error && error.message === "Version number is required") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`Failed to add version for template ${params.id}`, error);
    return NextResponse.json({ error: "Failed to add version" }, { status: 500 });
  }
}
