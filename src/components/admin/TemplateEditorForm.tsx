"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageDropInput from "@/components/ui/ImageDropInput";

import TemplateLivePreview from "./TemplateLivePreview";

import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-one_dark";

const AceEditor = dynamic(async () => (await import("react-ace")).default, { ssr: false });

const defaultMeta = '{\n  "themes": [],\n  "fields": []\n}';

export type TemplateEditorFormProps = {
  initialData?: TemplateEditorData | null;
  isEdit?: boolean;
};

type TemplateEditorVersion = {
  number?: string;
  changelog?: string;
  previewUrl?: string;
  inlineHtml?: string;
  inlineCss?: string;
  inlineMeta?: string;
};

type TemplateEditorData = {
  _id: string;
  name?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  currentVersion?: string;
  previewUrl?: string;
  versions?: TemplateEditorVersion[];
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
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

export default function TemplateEditorForm({ initialData, isEdit = false }: TemplateEditorFormProps) {
  const router = useRouter();
  const firstVersion = Array.isArray(initialData?.versions) ? initialData?.versions[0] : undefined;
  const activeVersion =
    Array.isArray(initialData?.versions) && initialData?.currentVersion
      ? initialData.versions.find((version) => version.number === initialData.currentVersion) ?? firstVersion
      : firstVersion;
  const [form, setForm] = useState<FormState>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    description: initialData?.description ?? "",
    thumbnail: initialData?.thumbnail ?? "",
    category: initialData?.category ?? "",
    subcategory: initialData?.subcategory ?? "",
    tags: (initialData?.tags ?? []).join(", "),
    version: initialData?.currentVersion ?? "1.0.0",
    changelog: activeVersion?.changelog ?? "",
    previewUrl: activeVersion?.previewUrl ?? initialData?.previewUrl ?? "",
    html: activeVersion?.inlineHtml ?? "",
    css: activeVersion?.inlineCss ?? "",
    meta: activeVersion?.inlineMeta ?? defaultMeta,
  });

  const [loading, setLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!form.meta.trim()) {
        setMetaError(null);
        return;
      }
      JSON.parse(form.meta);
      setMetaError(null);
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : "Invalid JSON");
    }
  }, [form.meta]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (metaError) return;

    setLoading(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      thumbnail: form.thumbnail,
      category: form.category,
      subcategory: form.subcategory,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      versions: [
        {
          number: form.version,
          changelog: form.changelog,
          previewUrl: form.previewUrl,
          inlineHtml: form.html,
          inlineCss: form.css,
          inlineMeta: form.meta,
        },
      ],
      currentVersion: form.version,
      published: true,
    };

    const endpoint = isEdit && initialData?._id ? `/api/admin/templates/${initialData._id}` : "/api/admin/templates";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Template" : "Create Template"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Template Name"
              className="w-full rounded bg-gray-900 p-2 text-white"
            />
            <input
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="Slug"
              className="w-full rounded bg-gray-900 p-2 text-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Category"
              className="w-full rounded bg-gray-900 p-2 text-white"
            />
            <input
              value={form.subcategory}
              onChange={(event) => setForm({ ...form, subcategory: event.target.value })}
              placeholder="Subcategory"
              className="w-full rounded bg-gray-900 p-2 text-white"
            />
          </div>

          <input
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            placeholder="Tags (comma separated)"
            className="w-full rounded bg-gray-900 p-2 text-white"
          />

          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description"
            className="h-24 w-full rounded bg-gray-900 p-2 text-white"
          />

          <ImageDropInput
            label="Thumbnail"
            value={form.thumbnail}
            onChange={(url) => setForm({ ...form, thumbnail: url })}
            onClear={() => setForm({ ...form, thumbnail: "" })}
            description="Upload an image shown in the catalog (PNG, JPG, GIF up to 4MB)."
            disabled={loading}
          />

          <input
            value={form.version}
            onChange={(event) => setForm({ ...form, version: event.target.value })}
            placeholder="Version"
            className="w-full rounded bg-gray-900 p-2 text-white"
          />

          <textarea
            value={form.changelog}
            onChange={(event) => setForm({ ...form, changelog: event.target.value })}
            placeholder="Changelog"
            className="h-24 w-full rounded bg-gray-900 p-2 text-white"
          />

          <input
            type="text"
            value={form.previewUrl}
            onChange={(event) => setForm({ ...form, previewUrl: event.target.value })}
            placeholder="Preview image URL"
            className="w-full rounded bg-gray-900 p-2 text-white"
          />

          <div>
            <p className="mb-2 text-sm text-gray-400">HTML</p>
            <AceEditor
              mode="html"
              theme="one_dark"
              width="100%"
              height="250px"
              value={form.html}
              onChange={(value) => setForm({ ...form, html: value })}
              setOptions={{ useWorker: false }}
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-400">CSS</p>
            <AceEditor
              mode="css"
              theme="one_dark"
              width="100%"
              height="250px"
              value={form.css}
              onChange={(value) => setForm({ ...form, css: value })}
              setOptions={{ useWorker: false }}
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-gray-400">meta.json</p>
            <AceEditor
              mode="json"
              theme="one_dark"
              width="100%"
              height="250px"
              value={form.meta}
              onChange={(value) => setForm({ ...form, meta: value })}
              setOptions={{ useWorker: false }}
            />
            {metaError && <p className="mt-1 text-xs text-red-400">Invalid JSON: {metaError}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateLivePreview html={form.html} css={form.css} meta={safeParse(form.meta)} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}

function safeParse(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}
