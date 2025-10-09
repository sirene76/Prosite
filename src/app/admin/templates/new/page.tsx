"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTemplatePreview } from "@/hooks/useTemplatePreview";
import TemplateLivePreview from "@/components/admin/TemplateLivePreview";

type FormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string;
  version: string;
  changelog: string;
  htmlUrl: string;
  cssUrl: string;
  metaUrl: string;
  previewUrl: string;
  html: string;
  css: string;
  meta: string;
};

type UploadKey = "htmlUrl" | "cssUrl" | "metaUrl" | "previewUrl";
type UploadType = "preview" | "html" | "css" | "meta";
type UploadUrlKey = Extract<UploadKey, `${UploadType}Url`>;

const uploadFieldOrder: Array<{
  key: Extract<UploadKey, "htmlUrl" | "cssUrl" | "metaUrl">;
  label: string;
  helper: string;
  variant: Extract<UploadType, "html" | "css" | "meta">;
}> = [
  {
    key: "htmlUrl",
    label: "HTML File",
    helper: "Upload the compiled HTML file for this template.",
    variant: "html",
  },
  {
    key: "cssUrl",
    label: "CSS File",
    helper: "Upload the styles that accompany the template.",
    variant: "css",
  },
  {
    key: "metaUrl",
    label: "meta.json File",
    helper: "Provide the template metadata JSON file.",
    variant: "meta",
  },
];

const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];

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
    category: "",
    subcategory: "",
    tags: "",
    version: "1.0.0",
    changelog: "",
    htmlUrl: "",
    cssUrl: "",
    metaUrl: "",
    previewUrl: "",
    html: "",
    css: "",
    meta: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<
    | { type: "success" | "error"; message: string }
    | null
  >(null);
  const { ready, html, css, meta, loading: previewLoading } = useTemplatePreview(
    form.htmlUrl,
    form.cssUrl,
    form.metaUrl,
  );

  useEffect(() => {
    console.log("🔍 Form URLs:", {
      htmlUrl: form.htmlUrl,
      cssUrl: form.cssUrl,
      metaUrl: form.metaUrl,
    });
  }, [form.htmlUrl, form.cssUrl, form.metaUrl]);

  useEffect(() => {
    console.log("🛰️ Template preview state changed", {
      ready,
      previewLoading,
      hasHtml: !!html,
      hasCss: !!css,
      hasMeta: !!meta,
    });
  }, [ready, previewLoading, html, css, meta]);

  useEffect(() => {
    if (form.htmlUrl && form.cssUrl) {
      console.log("🔁 Refreshing live preview with new uploads...");
    }
  }, [form.htmlUrl, form.cssUrl]);

  function handleUploadComplete(type: UploadType, res?: Array<{ url?: string }>) {
    const url = res?.[0]?.url;
    if (!url) return console.error(`❌ Missing URL for ${type} upload`, res);

    const key = `${type}Url` as UploadUrlKey;
    setForm((prev) => ({ ...prev, [key]: url }));
    console.log(`✅ ${type.toUpperCase()} uploaded:`, url);

    const typeLabelMap: Record<UploadType, string> = {
      preview: "Preview asset",
      html: "HTML file",
      css: "CSS file",
      meta: "Metadata file",
    };

    setUploadFeedback({ type: "success", message: `${typeLabelMap[type]} uploaded successfully.` });
  }

  function handleUploadError(error: Error) {
    console.error("❌ Upload failed:", error);
    setUploadFeedback({ type: "error", message: `Upload failed: ${error.message}` });
  }

  const isPreviewVideo = useMemo(() => {
    if (!form.previewUrl) return false;
    return videoExtensions.some((ext) => form.previewUrl.toLowerCase().endsWith(ext));
  }, [form.previewUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const versionNumber = form.version.trim() || "1.0.0";

    try {
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          category: form.category,
          subcategory: form.subcategory,
          tags,
          versions: [
            {
              number: versionNumber,
              changelog: form.changelog,
              htmlUrl: form.htmlUrl,
              cssUrl: form.cssUrl,
              metaUrl: form.metaUrl,
              previewUrl: form.previewUrl,
              inlineHtml: form.html,
              inlineCss: form.css,
              inlineMeta: form.meta,
            },
          ],
          currentVersion: versionNumber,
          published: true,
        }),
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
            Provide the core details, upload template assets, and author inline code snippets before saving your new template to the
            library.
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
              <CardTitle>Template Uploads</CardTitle>
              <CardDescription>Upload preview media and the core files associated with this template.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-10 pt-6 lg:grid-cols-2">
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
              <div>
                <p className="text-sm font-semibold text-slate-200">Preview Image / Video</p>
                <p className="text-xs text-slate-400">
                  Drag and drop an image or video or click inside the dropzone to choose a file.
                </p>
                <UploadDropzone
                  endpoint="templateFiles"
                  onClientUploadComplete={(res) => {
                    console.log("📁 Preview dropzone upload result:", res);
                    handleUploadComplete("preview", res);
                  }}
                  onUploadError={handleUploadError}
                  className={`${uploadDropzoneClassName} mt-4 cursor-pointer hover:border-pink-400`}
                />
                {form.previewUrl ? (
                  <>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-black/40">
                      {isPreviewVideo ? (
                        <video
                          key={form.previewUrl}
                          src={form.previewUrl}
                          controls
                          className="h-64 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="relative h-64 w-full">
                          <Image
                            alt="Template preview"
                            src={form.previewUrl}
                            fill
                            sizes="(min-width: 1024px) 480px, 100vw"
                            className="rounded-xl object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>Uploaded: {getUploadedFileName(form.previewUrl)}</span>
                      <UploadButton
                        endpoint="templateFiles"
                        onClientUploadComplete={(res) => handleUploadComplete("preview", res)}
                        onUploadError={handleUploadError}
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
                  </>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Supports images (JPG, PNG, GIF) and videos (MP4, WEBM, MOV).
                  </p>
                )}
              </div>
              <div className="space-y-6">
                {uploadFieldOrder.map(({ key, label, helper, variant }) => (
                  <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
                    <p className="text-sm font-semibold text-slate-200">{label}</p>
                    <p className="text-xs text-slate-400">{helper}</p>
                    <UploadDropzone
                      endpoint="templateFiles"
                      onClientUploadComplete={(res) => {
                        console.log(`📁 ${label} dropzone upload result:`, res);
                        handleUploadComplete(variant, res);
                      }}
                      onUploadError={handleUploadError}
                      className={`${uploadDropzoneClassName} mt-4 cursor-pointer hover:border-pink-400`}
                    />
                    {form[key] ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span>Uploaded: {getUploadedFileName(form[key])}</span>
                        <UploadButton
                          endpoint="templateFiles"
                          onClientUploadComplete={(res) => handleUploadComplete(variant, res)}
                          onUploadError={handleUploadError}
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
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">No file uploaded yet.</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Template Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-400">
                {form.htmlUrl && form.cssUrl
                  ? ready
                    ? "✅ Code files detected, preview should load below."
                    : "⏳ Files uploaded. Fetching preview content..."
                  : "⏳ Waiting for HTML & CSS uploads..."}
              </p>
              <TemplateLivePreview html={html} css={css} meta={meta} loading={previewLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Template Code</CardTitle>
              <CardDescription>Draft inline HTML, CSS, and metadata to accompany this template.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-3">
              <CodeEditorField
                label="HTML"
                placeholder="Paste or write the core HTML structure here."
                value={form.html}
                onChange={(value) => updateField("html", value)}
              />
              <CodeEditorField
                label="CSS"
                placeholder="Include scoped CSS for this template."
                value={form.css}
                onChange={(value) => updateField("css", value)}
              />
              <CodeEditorField
                label="meta.json"
                placeholder='{"title": "Landing Page", "tags": ["marketing"]}'
                value={form.meta}
                onChange={(value) => updateField("meta", value)}
                languageHint="JSON"
              />
            </CardContent>
          </Card>

          <div className="flex flex-col items-end gap-4 pb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Templates are saved with the latest upload and inline code snippets for the selected version.
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

type CodeEditorFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  languageHint?: string;
};

function CodeEditorField({ label, placeholder, value, onChange, languageHint }: CodeEditorFieldProps) {
  const characterCount = value.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          {languageHint ? (
            <span className="text-xs uppercase tracking-wide text-indigo-400">{languageHint}</span>
          ) : (
            <span className="text-xs uppercase tracking-wide text-indigo-400">{label}</span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{characterCount} chars</span>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[18rem] w-full resize-y rounded-xl border-slate-200/70 bg-slate-950/5 font-mono text-[13px] leading-6 text-slate-800 shadow-inner focus-visible:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100"
      />
    </div>
  );
}
