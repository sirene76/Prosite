"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { applyThemeToIframe } from "@/lib/applyThemeToIframe";
import type { TemplateMeta } from "@/types/template";
import { useUploadThing } from "@/utils/uploadthing";

type ThemeOption = {
  name: string;
  colors: Record<string, string>;
  fonts?: Record<string, string>;
};

function normaliseThemes(meta: TemplateMeta | null | undefined): ThemeOption[] {
  const source = (meta as { themes?: unknown })?.themes;

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((theme) => {
      if (
        theme &&
        typeof theme === "object" &&
        typeof (theme as { name?: unknown }).name === "string" &&
        typeof (theme as { colors?: unknown }).colors === "object" &&
        (theme as { colors?: unknown }).colors !== null
      ) {
        const colors: Record<string, string> = {};
        Object.entries((theme as { colors: Record<string, unknown> }).colors).forEach(([key, value]) => {
          if (typeof value === "string" && value.trim()) {
            colors[key] = value;
          }
        });

        const fonts: Record<string, string> = {};
        const sourceFonts = (theme as { fonts?: Record<string, unknown> }).fonts;
        if (sourceFonts && typeof sourceFonts === "object") {
          Object.entries(sourceFonts).forEach(([key, value]) => {
            if (typeof value === "string" && value.trim()) {
              fonts[key] = value;
            }
          });
        }

        return {
          name: (theme as { name: string }).name,
          colors,
          fonts,
        } satisfies ThemeOption;
      }

      return null;
    })
    .filter((theme): theme is ThemeOption => Boolean(theme));
}

type TemplatePreview = {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  meta?: TemplateMeta | null;
  basePath?: string | null;
  previewPath?: string | null;
  previewHtml?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  previewUrl?: string | null;
  previewVideo?: string | null;
  stageId?: string | null;
};

export default function AddTemplatePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [template, setTemplate] = useState<TemplatePreview | null>(null);
  const [supportsSrcDoc, setSupportsSrcDoc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [activeThemeId, setActiveTheme] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const router = useRouter();
  const { startUpload: startTemplateMediaUpload, isUploading: isUploadingTemplateMedia } =
    useUploadThing("templateMedia");

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.name === activeThemeId) ?? (themes.length ? themes[0] : null),
    [activeThemeId, themes],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      setSupportsSrcDoc(false);
      return;
    }

    const iframe = document.createElement("iframe");
    setSupportsSrcDoc("srcdoc" in iframe);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    const theme = activeTheme;

    if (!iframe || !theme) return;

    const applyTheme = () => {
      applyThemeToIframe(iframe, theme.colors);

      if (theme.fonts) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const root = doc?.documentElement;

        if (!root) {
          return;
        }

        Object.entries(theme.fonts).forEach(([key, value]) => {
          if (value.trim()) {
            const variableName = key.startsWith("--font-") ? key : `--font-${key}`;
            root.style.setProperty(variableName, value);
          }
        });
      }
    };

    const handleLoad = () => {
      applyTheme();
    };

    iframe.addEventListener("load", handleLoad);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    let timeout: number | null = null;

    if (doc?.readyState === "complete" || doc?.readyState === "interactive") {
      applyTheme();
    } else if (supportsSrcDoc && template?.previewHtml) {
      timeout = window.setTimeout(applyTheme, 50);
    }

    return () => {
      iframe.removeEventListener("load", handleLoad);
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
    };
  }, [activeTheme, supportsSrcDoc, template?.previewHtml, template?.previewPath]);

  function resetState() {
    setTemplate(null);
    setStatus("");
    setThemes([]);
    setActiveTheme(null);
    setImageUrl(null);
    setThumbnailUrl(null);
    setVideoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  }

  async function handleMediaUpload(
    e: ChangeEvent<HTMLInputElement>,
    type: "image" | "thumbnail" | "video",
  ) {
    const file = e.target.files?.[0];
    if (!file || !startTemplateMediaUpload) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const result = await startTemplateMediaUpload([file]);
      console.log("UploadThing result:", result);

      const serverData = (result?.[0] as { serverData?: { url?: string; ufsUrl?: string } } | undefined)?.serverData;
      const uploadedUrl =
        result?.[0]?.ufsUrl ??
        result?.[0]?.url ??
        serverData?.ufsUrl ??
        serverData?.url ??
        null;

      if (!uploadedUrl) {
        throw new Error("UploadThing did not return a file URL");
      }

      if (type === "image") {
        setImageUrl(uploadedUrl);
        setTemplate((prev) => (prev ? { ...prev, image: uploadedUrl } : prev));
      } else if (type === "thumbnail") {
        setThumbnailUrl(uploadedUrl);
        setTemplate((prev) => (prev ? { ...prev, thumbnail: uploadedUrl } : prev));
      } else if (type === "video") {
        setVideoUrl(uploadedUrl);
        setTemplate((prev) => (prev ? { ...prev, previewVideo: uploadedUrl } : prev));
      }

      e.target.value = "";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Media upload failed";
      setError(message);
      if (type === "image") {
        setImageUrl(null);
      } else if (type === "thumbnail") {
        setThumbnailUrl(null);
      } else {
        setVideoUrl(null);
      }
    }
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setStatus("");
    setTemplate(null);
    setThemes([]);
    setActiveTheme(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }
      if (thumbnailUrl) {
        formData.append("thumbnailUrl", thumbnailUrl);
      }
      if (videoUrl) {
        formData.append("videoUrl", videoUrl);
      }
      const res = await fetch("/api/admin/templates/upload", { method: "POST", body: formData });
      const data: { success?: boolean; template?: TemplatePreview; error?: string } = await res.json();

      if (res.ok && data.success && data.template) {
        setTemplate(data.template);
        setImageUrl(data.template.image ?? imageUrl ?? null);
        setThumbnailUrl(data.template.thumbnail ?? thumbnailUrl ?? null);
        setVideoUrl(data.template.previewVideo ?? videoUrl ?? null);
        const themeOptions = normaliseThemes(data.template.meta ?? null);
        setThemes(themeOptions);
        setActiveTheme(themeOptions.length ? themeOptions[0].name : null);
        setStatus("Preview ready. Review and save when you're ready.");
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template?.stageId) return;

    setSaving(true);
    setError("");
    setStatus("");

    try {
      const res = await fetch("/api/admin/templates/upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: template.stageId }),
      });
      const data: { success?: boolean; template?: TemplatePreview; error?: string } = await res.json();

      if (res.ok && data.success && data.template) {
        router.push("/admin/templates");
        return;
      } else {
        setError(data.error || "Failed to save template");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!template?.stageId) {
      resetState();
      return;
    }

    setCancelling(true);
    setError("");
    setStatus("");

    try {
      const res = await fetch("/api/admin/templates/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: template.stageId }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel upload");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      resetState();
      setCancelling(false);
    }
  }

  const currentImage = template?.image ?? imageUrl;
  const currentThumbnail = template?.thumbnail ?? thumbnailUrl ?? currentImage ?? null;
  const currentVideo = template?.previewVideo ?? videoUrl;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Add New Template</h1>
      <div className="bg-white shadow rounded-md p-6 space-y-6">
        <div>
          <label className="block font-medium mb-2">Upload Template (.zip)</label>
          <input
            type="file"
            accept=".zip"
            ref={fileInputRef}
            onChange={handleUpload}
            className="block w-full text-sm border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block font-medium mb-2">Preview Image (optional)</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              ref={imageInputRef}
              onChange={(event) => {
                void handleMediaUpload(event, "image");
              }}
              disabled={isUploadingTemplateMedia}
              className="block w-full text-sm border border-gray-300 rounded-md p-2 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">This image is used when no preview video is provided.</p>
            {currentImage && (
              <div className="relative mt-3 h-40 w-full overflow-hidden rounded-md border">
                <Image
                  src={currentImage}
                  alt="Template preview"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block font-medium mb-2">Thumbnail (optional)</label>
            <input
              type="file"
              name="thumbnail"
              accept="image/*"
              ref={thumbnailInputRef}
              onChange={(event) => {
                void handleMediaUpload(event, "thumbnail");
              }}
              disabled={isUploadingTemplateMedia}
              className="block w-full text-sm border border-gray-300 rounded-md p-2 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Used in template listings when available.</p>
            {currentThumbnail && (
              <div className="relative mt-3 h-32 w-full overflow-hidden rounded-md border">
                <Image
                  src={currentThumbnail}
                  alt="Template thumbnail"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block font-medium mb-2">Preview Video (optional)</label>
            <input
              type="file"
              name="video"
              accept="video/mp4,video/webm"
              ref={videoInputRef}
              onChange={(event) => {
                void handleMediaUpload(event, "video");
              }}
              disabled={isUploadingTemplateMedia}
              className="block w-full text-sm border border-gray-300 rounded-md p-2 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Supports MP4 or WebM formats.</p>
            {currentVideo && (
              <video
                src={currentVideo}
                controls
                className="mt-3 h-40 w-full rounded-md border object-cover"
              />
            )}
          </div>
        </div>
        {isUploadingTemplateMedia && <p className="text-gray-600">Uploading media...</p>}
        {loading && <p className="text-gray-600">Processing upload...</p>}
        {status && !error && <p className="text-green-600">{status}</p>}
        {error && <p className="text-red-500">{error}</p>}
        {template && (
          <>
            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2 text-lg">Template Info</h2>
              <p>
                <strong>Name:</strong> {template.name ?? "—"}
              </p>
              <p>
                <strong>Category:</strong> {template.category ?? "—"}
              </p>
              <p>
                <strong>Description:</strong> {template.description ?? "—"}
              </p>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h2 className="font-semibold mb-2 text-lg">Live Preview</h2>
              {themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => {
                        setActiveTheme(theme.name);
                      }}
                      className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                        activeTheme?.name === theme.name
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
              <iframe
                key={template?.stageId ?? template?.previewPath ?? "template-preview"}
                title="Template Preview"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={supportsSrcDoc ? template?.previewHtml ?? undefined : undefined}
                src={
                  supportsSrcDoc && template?.previewHtml
                    ? undefined
                    : template?.previewPath ?? undefined
                }
                ref={iframeRef}
                style={{ width: "100%", height: "700px", border: "1px solid #ccc", borderRadius: "8px" }}
              />
              {template.stageId && (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
