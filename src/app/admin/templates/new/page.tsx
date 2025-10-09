"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import TemplateLivePreview from "@/components/admin/TemplateLivePreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateMeta } from "@/hooks/useTemplatePreview";

import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-one_dark";

const AceEditor = dynamic(async () => (await import("react-ace")).default, { ssr: false });

type FormState = {
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string;
  version: string;
  changelog: string;
  previewUrl: string;
  html: string;
  css: string;
  meta: string;
};

const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];
const defaultMeta = '{\n  "themes": [],\n  "fields": []\n}';

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
    previewUrl: "",
    html: "",
    css: "",
    meta: defaultMeta,
  });
  const [loading, setLoading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<
    | { type: "success" | "error"; message: string }
    | null
  >(null);
  const [parsedMeta, setParsedMeta] = useState<TemplateMeta | Record<string, unknown> | null>(() => {
    try {
      return JSON.parse(defaultMeta);
    } catch {
      return null;
    }
  });
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!form.meta.trim()) {
        setParsedMeta({});
        setMetaError(null);
        setUploadFeedback((prev) =>
          prev && prev.type === "error" && prev.message.includes("meta.json") ? null : prev,
        );
        return;
      }
      const parsed = JSON.parse(form.meta) as TemplateMeta;
      setParsedMeta(parsed);
      setMetaError(null);
      setUploadFeedback((prev) =>
        prev && prev.type === "error" && prev.message.includes("meta.json") ? null : prev,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      setMetaError(message);
      setParsedMeta(null);
    }
  }, [form.meta]);

  function handleUploadComplete(res?: Array<{ url?: string }>) {
    const url = res?.[0]?.url;
    if (!url) return console.error("❌ Missing URL for preview upload", res);

    setForm((prev) => ({ ...prev, previewUrl: url }));
    setUploadFeedback({ type: "success", message: "Preview asset uploaded successfully." });
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
    if (metaError) {
      return setUploadFeedback({ type: "error", message: "Please fix meta.json before saving." });
    }

    setLoading(true);

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const versionNumber = form.version.trim() || "1.0.0";

    try {
      const payload = {
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
            previewUrl: form.previewUrl,
            inlineHtml: form.html,
            inlineCss: form.css,
            inlineMeta: form.meta,
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
              <CardTitle>Template Preview Asset</CardTitle>
              <CardDescription>Upload the image or video shown in the template catalog.</CardDescription>
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
                  <p className="text-sm font-semibold text-slate-200">Preview Image / Video</p>
                  <p className="text-xs text-slate-400">
                    Drag and drop a file or click inside the dropzone to choose one.
                  </p>
                </div>
                <UploadDropzone
                  endpoint="templateFiles"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  className={`${uploadDropzoneClassName} cursor-pointer hover:border-pink-400`}
                />
                <p className="text-xs text-slate-500">
                  Supports images (JPG, PNG, GIF) and videos (MP4, WEBM, MOV).
                </p>
              </div>
              <div>
                {form.previewUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-black/40">
                    {isPreviewVideo ? (
                      <video key={form.previewUrl} src={form.previewUrl} controls className="h-64 w-full object-cover" />
                    ) : (
                      <div className="relative h-64 w-full">
                        <Image
                          alt="Template preview"
                          src={form.previewUrl}
                          fill
                          sizes="(min-width: 1024px) 480px, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                    Preview asset not uploaded yet.
                  </div>
                )}
                {form.previewUrl && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Uploaded: {getUploadedFileName(form.previewUrl)}</span>
                    <UploadButton
                      endpoint="templateFiles"
                      onClientUploadComplete={handleUploadComplete}
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
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Template Code</CardTitle>
              <CardDescription>Author HTML, CSS, and metadata directly with live preview updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div>
                <p className="font-semibold mb-2 text-sm text-gray-400">HTML</p>
                <AceEditor
                  mode="html"
                  theme="one_dark"
                  width="100%"
                  height="250px"
                  value={form.html}
                  onChange={(value) => updateField("html", value)}
                  setOptions={{ useWorker: false }}
                />
              </div>
              <div>
                <p className="font-semibold mb-2 text-sm text-gray-400">CSS</p>
                <AceEditor
                  mode="css"
                  theme="one_dark"
                  width="100%"
                  height="250px"
                  value={form.css}
                  onChange={(value) => updateField("css", value)}
                  setOptions={{ useWorker: false }}
                />
              </div>
              <div>
                <p className="font-semibold mb-2 text-sm text-gray-400">meta.json</p>
                <AceEditor
                  mode="json"
                  theme="one_dark"
                  width="100%"
                  height="250px"
                  value={form.meta}
                  onChange={(value) => updateField("meta", value)}
                  setOptions={{ useWorker: false }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle>Template Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-xs text-gray-400">
                {form.html
                  ? "Typing updates the preview automatically."
                  : "Start writing HTML to see the live preview."}
              </p>
              {metaError && <p className="text-xs text-rose-300">meta.json error: {metaError}</p>}
              <TemplateLivePreview html={form.html} css={form.css} meta={parsedMeta ?? undefined} />
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
