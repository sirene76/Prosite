"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_TEMPLATE_THUMBNAIL } from "@/lib/constants";
import { useUploadThing } from "@/utils/uploadthing";

type TemplateMedia = {
  _id: string;
  name?: string;
  image?: string | null;
  thumbnail?: string | null;
  previewUrl?: string | null;
  previewVideo?: string | null;
};

type UploadType = "image" | "thumbnail" | "video";

type Props = {
  template: TemplateMedia;
};

export function TemplateMediaEditor({ template }: Props) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState(template.image ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(template.thumbnail ?? "");
  const [videoUrl, setVideoUrl] = useState(template.previewVideo ?? "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { startUpload, isUploading } = useUploadThing("templateMedia");

  const previewImage = (imageUrl || thumbnailUrl || template.previewUrl || DEFAULT_TEMPLATE_THUMBNAIL) ??
    DEFAULT_TEMPLATE_THUMBNAIL;
  const thumbnailPreview = thumbnailUrl || imageUrl || DEFAULT_TEMPLATE_THUMBNAIL;

  function resetFileInput(type: UploadType) {
    if (type === "image" && imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (type === "thumbnail" && thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
    if (type === "video" && videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>, type: UploadType) {
    const file = event.target.files?.[0];
    if (!file || !startUpload) {
      resetFileInput(type);
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const result = await startUpload([file]);
      const uploadedUrl = result?.[0]?.url;

      if (!uploadedUrl) {
        throw new Error("Upload did not return a file URL");
      }

      if (type === "image") {
        setImageUrl(uploadedUrl);
        setStatusMessage("Preview image uploaded.");
      } else if (type === "thumbnail") {
        setThumbnailUrl(uploadedUrl);
        setStatusMessage("Thumbnail uploaded.");
      } else {
        setVideoUrl(uploadedUrl);
        setStatusMessage("Preview video uploaded.");
      }
    } catch (error) {
      console.error("Failed to upload template media", error);
      setErrorMessage("Failed to upload file. Please try again.");
    } finally {
      resetFileInput(type);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("imageUrl", imageUrl.trim());
    formData.append("thumbnailUrl", thumbnailUrl.trim());
    formData.append("videoUrl", videoUrl.trim());

    try {
      const response = await fetch(`/api/admin/templates/${template._id}/update-media`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to save template media");
      }

      const data = (await response.json()) as TemplateMedia;

      setImageUrl(data.image ?? "");
      setThumbnailUrl(data.thumbnail ?? "");
      setVideoUrl(data.previewVideo ?? "");
      setStatusMessage("Template media updated.");
      router.refresh();
    } catch (error) {
      console.error("Failed to save template media", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to save template media");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Update Template Media</h1>
        <p className="text-sm text-slate-400">
          Update the preview image, thumbnail, and preview video for {template.name ?? "this template"}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Preview Image</h2>
            <p className="text-sm text-slate-400">
              This image is shown on the template detail page and used as a fallback preview.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
            <Image
              src={previewImage}
              alt="Template preview"
              width={640}
              height={360}
              className="h-60 w-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Preview image URL</label>
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://example.com/preview.jpg"
              disabled={saving || isUploading}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => imageInputRef.current?.click()}
              disabled={saving || isUploading}
            >
              Upload image
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFileUpload(event, "image")}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Thumbnail</h2>
            <p className="text-sm text-slate-400">
              A smaller image used in template listings.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
            <Image
              src={thumbnailPreview}
              alt="Template thumbnail"
              width={320}
              height={180}
              className="h-48 w-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Thumbnail URL</label>
            <Input
              value={thumbnailUrl}
              onChange={(event) => setThumbnailUrl(event.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              disabled={saving || isUploading}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={saving || isUploading}
            >
              Upload thumbnail
            </Button>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFileUpload(event, "thumbnail")}
            />
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Preview Video</h2>
          <p className="text-sm text-slate-400">Optional video preview shown on the template detail page.</p>
        </div>

        {videoUrl ? (
          <video
            controls
            className="aspect-video w-full overflow-hidden rounded-lg border border-slate-800 bg-black"
            src={videoUrl}
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-400">
            No preview video uploaded.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Preview video URL</label>
          <Input
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://example.com/preview.mp4"
            disabled={saving || isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => videoInputRef.current?.click()}
            disabled={saving || isUploading}
          >
            Upload video
          </Button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => handleFileUpload(event, "video")}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {statusMessage && <p className="text-sm text-emerald-400">{statusMessage}</p>}
          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
          {!statusMessage && !errorMessage && (
            <p className="text-sm text-slate-400">Changes are saved by submitting the form.</p>
          )}
        </div>
        <Button type="submit" disabled={saving || isUploading}>
          {saving ? "Saving..." : isUploading ? "Uploading..." : "Save media"}
        </Button>
      </div>
    </form>
  );
}
