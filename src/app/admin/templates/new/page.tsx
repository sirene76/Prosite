"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

type UploadedFile = {
  url: string;
  name?: string;
  key?: string;
};

const uploadFieldOrder: Array<{ key: UploadKey; label: string; helper: string }> = [
  {
    key: "htmlUrl",
    label: "HTML File",
    helper: "Upload the compiled HTML file for this template.",
  },
  {
    key: "cssUrl",
    label: "CSS File",
    helper: "Upload the styles that accompany the template.",
  },
  {
    key: "metaUrl",
    label: "meta.json File",
    helper: "Provide the template metadata JSON file.",
  },
];

const videoExtensions = [".mp4", ".webm", ".ogg", ".mov"];

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
  const [fileNames, setFileNames] = useState<Record<UploadKey, string>>({
    htmlUrl: "",
    cssUrl: "",
    metaUrl: "",
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);

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

  function handleUpload(key: UploadKey) {
    return (files?: UploadedFile[]) => {
      if (!files?.length) return;
      const file = files[0];
      setFileNames((prev) => ({ ...prev, [key]: file.name ?? file.key ?? "Uploaded file" }));
      setForm((prev) => ({ ...prev, [key]: file.url }));
    };
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
            <CardContent className="space-y-8 pt-6">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-300">Preview Media</span>
                    <span className="text-xs text-slate-500/80 dark:text-slate-400/80">
                      Upload an image or short video to represent the template in the gallery.
                    </span>
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-400/50 bg-slate-50/40 p-4 shadow-inner dark:border-slate-700/70 dark:bg-slate-900/50">
                    {form.previewUrl ? (
                      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-200/60 bg-black/40 dark:border-slate-700/60">
                        {isPreviewVideo ? (
                          <video
                            key={form.previewUrl}
                            controls
                            className="h-full w-full object-cover"
                            src={form.previewUrl}
                          />
                        ) : (
                          <Image
                            alt="Template preview"
                            src={form.previewUrl}
                            fill
                            sizes="(min-width: 1024px) 480px, 100vw"
                            className="object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-400/40 bg-white/60 text-center text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/40">
                        <span className="text-sm font-medium">No preview uploaded yet</span>
                        <span className="max-w-[220px] text-xs text-slate-500/80 dark:text-slate-400/70">
                          Drag in a screenshot or video, or use the Upload button below.
                        </span>
                      </div>
                    )}
                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <UploadButton
                        endpoint="templateAssets"
                        appearance={{
                          container: "w-full",
                          button:
                            "w-full justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400",
                        }}
                        onClientUploadComplete={handleUpload("previewUrl")}
                        onUploadError={(error) => console.error("Preview upload failed", error)}
                      />
                      {form.previewUrl && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Uploaded: {fileNames.previewUrl || "Preview asset"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {uploadFieldOrder.map(({ key, label, helper }) => (
                    <div key={key} className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>
                      </div>
                      <UploadButton
                        endpoint="templateAssets"
                        appearance={{
                          container: "w-full",
                          button:
                            "w-full justify-center rounded-lg border border-indigo-400/80 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800",
                        }}
                        onClientUploadComplete={handleUpload(key)}
                        onUploadError={(error) => console.error(`${label} upload failed`, error)}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {form[key]
                          ? `Uploaded: ${fileNames[key] || "File successfully uploaded"}`
                          : "No file uploaded yet"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
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
