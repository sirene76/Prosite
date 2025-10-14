"use client";

import { useState, type ChangeEvent } from "react";
import { renderPreview } from "@/lib/renderPreview";
import type { TemplateMeta } from "@/types/template";

type TemplateResponse = {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  html: string;
  css: string;
  js?: string | null;
  meta?: TemplateMeta | null;
  basePath?: string | null;
};

export default function AddTemplatePage() {
  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setTemplate(null);
    setPreview("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/templates/upload", { method: "POST", body: formData });
      const data: { success?: boolean; template?: TemplateResponse; error?: string } = await res.json();
      if (res.ok && data.success && data.template) {
        setTemplate(data.template);
        const previewTemplate = {
          html: data.template.html,
          css: data.template.css,
          js: data.template.js ?? undefined,
          meta: data.template.meta ?? undefined,
          basePath: data.template.basePath ?? undefined,
        };
        setPreview(renderPreview(previewTemplate));
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

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Add New Template</h1>
      <div className="bg-white shadow rounded-md p-6 space-y-6">
        <div>
          <label className="block font-medium mb-2">Upload Template (.zip)</label>
          <input
            type="file"
            accept=".zip"
            onChange={handleUpload}
            className="block w-full text-sm border border-gray-300 rounded-md p-2"
          />
        </div>
        {loading && <p className="text-gray-600">Processing upload...</p>}
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
            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2 text-lg">Live Preview</h2>
              <iframe
                title="Template Preview"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={preview}
                style={{ width: "100%", height: "700px", border: "1px solid #ccc", borderRadius: "8px" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
