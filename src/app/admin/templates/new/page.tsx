"use client";

import { useState } from "react";
import { renderPreview } from "@/lib/renderPreview";
import type { TemplateMeta } from "@/types/template";

type UploadedTemplate = {
  id: string;
  name?: string;
  html: string;
  css: string;
  js?: string;
  meta?: (TemplateMeta & Record<string, unknown>) | null;
  basePath?: string;
};

export default function AddTemplatePage() {
  const [template, setTemplate] = useState<UploadedTemplate | null>(null);
  const [preview, setPreview] = useState<string>("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/templates/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data?.success) {
      console.error("Template upload failed", data?.error);
      alert(data?.error || "Upload failed");
      return;
    }

    setTemplate(data.template as UploadedTemplate);
    setPreview(renderPreview(data.template));
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Template</h1>
        <p className="text-sm text-gray-500">Upload a ZIP containing index.html, style.css, script.js (optional), meta.json, and any assets.</p>
      </div>

      <input
        type="file"
        accept=".zip"
        onChange={handleUpload}
        className="border p-2 rounded"
      />

      {template && (
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-medium">Template:</span> {template.name || template.id}
          </p>
        </div>
      )}

      {preview && (
        <div className="w-full">
          <iframe
            title="Template Preview"
            sandbox="allow-scripts allow-same-origin"
            srcDoc={preview}
            style={{
              width: "100%",
              height: "800px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
        </div>
      )}
    </div>
  );
}
