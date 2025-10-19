import { revalidatePath } from "next/cache";
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

  try {
    const template = await Template.findById(id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const imageEntry = formData.get("imageUrl");
    const thumbnailEntry = formData.get("thumbnailUrl");
    const videoEntry = formData.get("videoUrl");

    const hasImageUpdate = typeof imageEntry === "string";
    const hasThumbnailUpdate = typeof thumbnailEntry === "string";
    const hasVideoUpdate = typeof videoEntry === "string";

    const rawImage = hasImageUpdate ? (imageEntry as string).trim() : null;
    const rawThumbnail = hasThumbnailUpdate ? (thumbnailEntry as string).trim() : null;
    const rawVideo = hasVideoUpdate ? (videoEntry as string).trim() : null;

    const nextImage = rawImage ? rawImage : undefined;
    const nextThumbnail = rawThumbnail ? rawThumbnail : undefined;
    const nextVideo = rawVideo ? rawVideo : undefined;

    if (hasImageUpdate) {
      template.image = nextImage;
    }

    if (hasThumbnailUpdate) {
      template.thumbnail = nextThumbnail;
    }

    if (hasVideoUpdate) {
      template.previewVideo = nextVideo;
    }

    let previewSource: string | undefined;
    if (hasImageUpdate || hasThumbnailUpdate) {
      previewSource = nextThumbnail ?? nextImage ?? DEFAULT_TEMPLATE_THUMBNAIL;
      template.previewUrl = previewSource;
    }

    const versions = template.versions ?? [];
    const currentVersion =
      (template.currentVersion && versions.find((version) => version.number === template.currentVersion)) ??
      versions[versions.length - 1];

    let versionsMutated = false;

    if (currentVersion) {
      if (previewSource !== undefined) {
        currentVersion.previewUrl = previewSource;
        versionsMutated = true;
      }

      if (hasVideoUpdate) {
        currentVersion.previewVideo = nextVideo;
        versionsMutated = true;
      }
    }

    if (versionsMutated) {
      template.markModified("versions");
    }

    await template.save();

    const updated = template.toObject();
    const stringId = template._id.toString();
    updated._id = stringId;
    updated.id = stringId;

    revalidatePath("/");
    revalidatePath("/templates");
    revalidatePath(`/templates/${stringId}`);
    if (typeof updated.slug === "string" && updated.slug.trim()) {
      revalidatePath(`/templates/${updated.slug}`);
    }

    revalidatePath("/");
    revalidatePath("/templates");
    revalidatePath(`/templates/${id}`);

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
