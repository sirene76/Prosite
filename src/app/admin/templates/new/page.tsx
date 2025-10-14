"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { renderPreview } from "@/utils/renderPreview";
import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  previewVideo: string;
  category: string;
  subcategory: string;
  tags: string;
  version: string;
  changelog: string;
  previewUrl: string;
};

type UploadedTemplate = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  previewVideo: string | null;
  assetsBasePath: string | null;
  html: string;
  css: string;
  meta: Record<string, unknown>;
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
};

const uploadDropzoneClassName =
  "ut-upload-area flex min-h-[200px] w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-300 transition-colors";

function getUploadedFileName(url: string) {
  const [path] = url.split("?");
  return path?.split("/").pop() ?? "Uploaded file";
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    description: "",
    thumbnail: "",
    previewVideo: "",
    category: "",
    subcategory: "",
    tags: "",
    version: "1.0.0",
    changelog: "",
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<
    | { type: "success" | "error"; message: string }
    | null
  >(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<UploadedTemplate | null>(null);
  const [templateUploadState, setTemplateUploadState] = useState<UploadState>({ status: "idle" });
  const previewDocument = useMemo(
    () => (uploadedTemplate ? renderPreview(uploadedTemplate) : ""),
    [uploadedTemplate]
  );
  const previewImage = form.previewUrl || uploadedTemplate?.image || null;

  function handlePreviewUploadComplete(res?: Array<{ url?: string }>) {
    const url = res?.[0]?.url;
    if (!url) return console.error("❌ Missing URL for preview upload", res);

    setForm((prev) => ({ ...prev, previewUrl: url }));
    setUploadFeedback({ type: "success", message: "Preview asset uploaded successfully." });
  }

  function handlePreviewUploadError(error: Error) {
    console.error("❌ Upload failed:", error);
    setUploadFeedback({ type: "error", message: `Upload failed: ${error.message}` });
  }

  function handleThumbnailUploadComplete(res?: Array<{ url?: string }>) {
    const url = res?.[0]?.url;
    if (!url) {
      console.error("❌ Missing URL for thumbnail upload", res);
      return;
    }

    setForm((prev) => ({ ...prev, thumbnail: url }));
  }

  function handleThumbnailUploadError(error: Error) {
    console.error("❌ Thumbnail upload failed:", error);
  }

  async function handleTemplateArchiveUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setTemplateUploadState({ status: "uploading", message: "Uploading template archive..." });

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/templates/upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: unknown } | null;
        const message =
          errorBody && typeof errorBody.error === "string"
            ? errorBody.error
            : "Failed to upload template archive.";
        setTemplateUploadState({ status: "error", message });
        return;
      }

      const data = (await response.json()) as { template?: Partial<UploadedTemplate> & Record<string, unknown> };
      const template = data.template;
      if (!template || typeof template.html !== "string" || typeof template.css !== "string") {
        setTemplateUploadState({ status: "error", message: "Upload response missing template files." });
        return;
      }

      const meta = template.meta && typeof template.meta === "object" && !Array.isArray(template.meta) ? template.meta : {};

      const normalized: UploadedTemplate = {
        id: typeof template.id === "string" && template.id ? template.id : template.slug ?? "",
        name: typeof template.name === "string" && template.name ? template.name : template.slug ?? "",
        slug: typeof template.slug === "string" ? template.slug : "",
        image: typeof template.image === "string" ? template.image : null,
        previewVideo: typeof template.previewVideo === "string" ? template.previewVideo : null,
        assetsBasePath: typeof template.assetsBasePath === "string" ? template.assetsBasePath : null,
        html: template.html,
        css: template.css,
        meta: meta as Record<string, unknown>,
      };

      setUploadedTemplate(normalized);
      setTemplateUploadState({ status: "success", message: `${normalized.name || normalized.slug} imported successfully.` });

      setForm((prev) => ({
        ...prev,
        name: normalized.name || prev.name,
        slug: normalized.slug || prev.slug,
        previewUrl: normalized.image ?? prev.previewUrl,
        previewVideo: normalized.previewVideo ?? prev.previewVideo,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while uploading template.";
      setTemplateUploadState({ status: "error", message });
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!uploadedTemplate) {
      setUploadFeedback({ type: "error", message: "Upload a template archive before saving." });
      return;
    }

    setLoading(true);

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const versionNumber = form.version.trim() || "1.0.0";
    const previewAsset = previewImage ?? "";
    const nameValue = form.name.trim() || uploadedTemplate.name;
    const slugValue = form.slug.trim() || uploadedTemplate.slug;

    if (!slugValue) {
      setLoading(false);
      setUploadFeedback({ type: "error", message: "Unable to determine template slug. Check meta.json." });
      return;
    }

    try {
      const payload = {
        name: nameValue,
        slug: slugValue,
        description: form.description,
        thumbnail: form.thumbnail,
        previewVideo: form.previewVideo,
        category: form.category,
        subcategory: form.subcategory,
        tags,
        versions: [
          {
            number: versionNumber,
            changelog: form.changelog,
            previewUrl: previewAsset,
            previewVideo: form.previewVideo,
            inlineHtml: uploadedTemplate.html,
            inlineCss: uploadedTemplate.css,
            inlineMeta: JSON.stringify(uploadedTemplate.meta ?? {}),
          },
        ],
        currentVersion: versionNumber,
        published: true,
      };

      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/admin/templates");
      }
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-slate-950/40 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Add New Template</h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Upload a packaged template archive to import HTML, CSS, and metadata automatically, then finish configuring the catalog
            details before publishing.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>Identify and categorize the template so it is easy to discover.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
              <Input
                autoComplete="off"
                placeholder="Template Name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              <Input placeholder="Slug" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
              />
              <Input
                placeholder="Subcategory"
                value={form.subcategory}
                onChange={(event) => updateField("subcategory", event.target.value)}
              />
              <Input
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
              />
              <Textarea
                className="md:col-span-2"
                placeholder="Describe the template, its key sections, and unique selling points."
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-none pb-0">
            <CardTitle>Template Files</CardTitle>
            <CardDescription>Upload a zip archive containing index.html, style.css, and meta.json.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">Template ZIP</label>
              <input
                type="file"
                accept=".zip"
                onChange={handleTemplateArchiveUpload}
                className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-10 text-center text-sm text-slate-300 transition hover:border-pink-400"
              />
              <p className="text-xs text-slate-500">
                We expect your archive to include <code className="font-mono text-rose-200">index.html</code>,
                <code className="font-mono text-rose-200">style.css</code>, and <code className="font-mono text-rose-200">meta.json</code>.
                Any additional assets will be copied to <code className="font-mono">/templates/&lt;slug&gt;</code>.
              </p>
            </div>

            {templateUploadState.status !== "idle" ? (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  templateUploadState.status === "success"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : templateUploadState.status === "error"
                      ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
                      : "border-slate-600 bg-slate-900/60 text-slate-300"
                }`}
              >
                {templateUploadState.message ??
                  (templateUploadState.status === "uploading" ? "Processing template archive..." : null)}
              </div>
            ) : null}

            {uploadedTemplate ? (
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-white">{uploadedTemplate.name || "Imported template"}</p>
                    <p className="text-xs text-slate-400">ID: {uploadedTemplate.id || "n/a"}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    Slug: {uploadedTemplate.slug || "pending"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Files saved to <code className="font-mono text-slate-200">/templates/{uploadedTemplate.slug}</code>
                </p>
                <p className="text-xs text-slate-500">
                  meta.json keys: {Object.keys(uploadedTemplate.meta ?? {}).length}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No template archive imported yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-none pb-0">
            <CardTitle>Template Thumbnail</CardTitle>
            <CardDescription>This image is shown across the admin list and landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {form.thumbnail ? (
                <div className="flex flex-col gap-3">
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-black/40">
                    <div className="relative h-40 w-full">
                      <Image
                        src={form.thumbnail}
                        alt="Template thumbnail"
                        fill
                        sizes="(min-width: 1024px) 320px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, thumbnail: "" }))}
                    className="self-start rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-pink-400 hover:text-white"
                  >
                    Remove thumbnail
                  </button>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                  No thumbnail uploaded yet.
                </div>
              )}

              <UploadButton
                endpoint="templateImage"
                onClientUploadComplete={handleThumbnailUploadComplete}
                onUploadError={handleThumbnailUploadError}
              />
              <p className="text-xs text-slate-500">PNG, JPG, or GIF up to 4MB.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Version Info</CardTitle>
              <CardDescription>Track how this release differs from previous versions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-500 dark:text-slate-300">Version Number</label>
                <Input
                  placeholder="e.g. 1.0.0"
                  value={form.version}
                  onChange={(event) => updateField("version", event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-1">
                <label className="text-sm font-medium text-slate-500 dark:text-slate-300">Changelog</label>
                <Textarea
                  className="min-h-[9rem]"
                  placeholder="Summarize updates, fixes, and improvements in this version."
                  value={form.changelog}
                  onChange={(event) => updateField("changelog", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Template Preview Asset</CardTitle>
              <CardDescription>Upload the image shown in the template catalog.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 pt-6 lg:grid-cols-2">
              {uploadFeedback && (
                <div
                  className={`lg:col-span-2 rounded-lg border px-4 py-3 text-sm ${
                    uploadFeedback.type === "success"
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {uploadFeedback.message}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Preview Image</p>
                  <p className="text-xs text-slate-400">
                    Drag and drop a file or click inside the dropzone to choose one.
                  </p>
                </div>
                <UploadDropzone
                  endpoint="templateImage"
                  onClientUploadComplete={handlePreviewUploadComplete}
                  onUploadError={handlePreviewUploadError}
                  className={`${uploadDropzoneClassName} cursor-pointer hover:border-pink-400`}
                />
                <p className="text-xs text-slate-500">Supports images (JPG, PNG, GIF) up to 4MB.</p>
              </div>
              <div>
                {previewImage ? (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-black/40">
                    <div className="relative h-64 w-full">
                      <Image
                        alt="Template preview"
                        src={previewImage}
                        fill
                        sizes="(min-width: 1024px) 480px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                    Preview asset not uploaded yet.
                  </div>
                )}
                {(form.previewUrl || uploadedTemplate?.image) && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      {form.previewUrl
                        ? `Uploaded: ${getUploadedFileName(form.previewUrl)}`
                        : `Imported from meta.json: ${uploadedTemplate?.image}`}
                    </span>
                    <UploadButton
                      endpoint="templateImage"
                      onClientUploadComplete={handlePreviewUploadComplete}
                      onUploadError={handlePreviewUploadError}
                      appearance={{
                        container: "",
                        button:
                          "rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-pink-400 hover:text-white",
                      }}
                      content={{
                        button: ({ ready }) => (ready ? "Replace file" : "Uploading..."),
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

      <Card>
        <CardHeader className="border-none pb-0">
          <CardTitle>Template Preview Video</CardTitle>
          <CardDescription>
            Upload an optional video file to demonstrate your template (e.g., hero animation or walkthrough).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {form.previewVideo ? (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <video
                key={form.previewVideo}
                src={form.previewVideo}
                controls
                className="w-full h-56 object-cover"
              />
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
              No preview video uploaded yet.
            </div>
          )}

          <UploadButton
            endpoint="templateVideo"
            onClientUploadComplete={(res) => {
              const url = res?.[0]?.url;
              if (url) {
                setForm((prev) => ({ ...prev, previewVideo: url }));
              }
            }}
            onUploadError={(err) => console.error("❌ Video upload failed:", err)}
          />

          {form.previewVideo ? (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, previewVideo: "" }))}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-pink-400 hover:text-white"
            >
              Remove video
            </button>
          ) : null}

          <p className="text-xs text-slate-500">MP4, WebM up to 50MB.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-none pb-0">
          <CardTitle>Template Preview</CardTitle>
          <CardDescription>Render the uploaded template with its default meta configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {uploadedTemplate ? (
            previewDocument ? (
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-black/40">
                <iframe
                  srcDoc={previewDocument}
                  className="h-[720px] w-full border-0"
                  title="Template preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Uploaded template does not include renderable HTML.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              Upload a template archive to generate a live preview.
            </div>
          )}
        </CardContent>
      </Card>
          <div className="flex flex-col items-end gap-4 pb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Templates are saved with the imported archive and any catalog details configured above.
            </p>
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? "Saving Template..." : "Save Template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
