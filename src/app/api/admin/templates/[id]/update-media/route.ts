import { NextResponse } from "next/server";

import { DEFAULT_TEMPLATE_THUMBNAIL } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const imageUrl = formData.get("imageUrl");
  const thumbnailUrl = formData.get("thumbnailUrl");
  const videoUrl = formData.get("videoUrl");

  const updates: Record<string, string | undefined> = {};
  let shouldUpdatePreview = false;

  if (typeof imageUrl === "string") {
    const trimmed = imageUrl.trim();
    updates.image = trimmed || undefined;
    shouldUpdatePreview = true;
  }

  if (typeof thumbnailUrl === "string") {
    const trimmed = thumbnailUrl.trim();
    updates.thumbnail = trimmed || undefined;
    shouldUpdatePreview = true;
  }

  if (typeof videoUrl === "string") {
    const trimmed = videoUrl.trim();
    updates.previewVideo = trimmed || undefined;
  }

  if (shouldUpdatePreview) {
    const previewSource = updates.thumbnail ?? updates.image ?? DEFAULT_TEMPLATE_THUMBNAIL;
    updates.previewUrl = previewSource;
  }

  try {
    const updated = await Template.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to update template media for ${id}`, error);
    return NextResponse.json({ error: "Failed to update template media" }, { status: 500 });
  }
}

function isCastError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "CastError");
}
