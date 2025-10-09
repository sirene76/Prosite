"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";

import type { TemplateMeta, TemplateTheme } from "@/hooks/useTemplatePreview";

type TemplateLivePreviewProps = {
  html: string;
  css: string;
  meta: TemplateMeta | null;
  loading: boolean;
};

export default function TemplateLivePreview({ html, css, meta, loading }: TemplateLivePreviewProps) {
  const themes = useMemo<TemplateTheme[]>(() => (Array.isArray(meta?.themes) ? meta.themes : []), [meta]);
  const [activeTheme, setActiveTheme] = useState<TemplateTheme | null>(themes[0] || null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    setActiveTheme(themes[0] || null);
  }, [themes]);

  const frameWidth = useMemo(() => {
    switch (device) {
      case "mobile":
        return 390;
      case "tablet":
        return 768;
      default:
        return "100%";
    }
  }, [device]);

  const doc = useMemo(() => {
    const colors = activeTheme?.colors || {};
    const vars = Object.entries(colors)
      .map(([k, v]) => `--${k}: ${v};`)
      .join(" ");
    return `
      <html>
        <head><style>:root { ${vars} } ${css}</style></head>
        <body>${html}</body>
      </html>`;
  }, [html, css, activeTheme]);

  if (loading) {
    return <div className="p-6 text-gray-400">Loading preview...</div>;
  }

  if (!html) {
    console.warn("🚫 No HTML passed to TemplateLivePreview");
    console.log("Props received:", { html, css, meta, loading });
    return <div className="p-6 text-gray-500">Upload HTML & CSS to see live preview.</div>;
  }

  console.log("🖥️ Rendering TemplateLivePreview", {
    htmlLength: html.length,
    cssLength: css.length,
    hasMeta: !!meta,
  });

  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <div className="flex flex-wrap justify-between items-center bg-gray-900 px-4 py-2 gap-3">
        <span className="text-gray-200 text-sm font-medium">Live Preview</span>
        <div className="flex items-center gap-3">
          {themes.length > 0 && (
            <select
              value={activeTheme?.name}
              onChange={(event) =>
                setActiveTheme(themes.find((theme) => theme.name === event.target.value) || null)
              }
              className="bg-gray-800 text-gray-100 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              {themes.map((theme) => (
                <option key={theme.name} value={theme.name}>
                  {theme.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2">
            <button
              className={`p-1.5 rounded-md border ${
                device === "desktop"
                  ? "border-pink-400 text-pink-400"
                  : "border-gray-700 text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setDevice("desktop")}
              title="Desktop"
            >
              <Monitor size={16} />
            </button>
            <button
              className={`p-1.5 rounded-md border ${
                device === "tablet"
                  ? "border-pink-400 text-pink-400"
                  : "border-gray-700 text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setDevice("tablet")}
              title="Tablet"
            >
              <Tablet size={16} />
            </button>
            <button
              className={`p-1.5 rounded-md border ${
                device === "mobile"
                  ? "border-pink-400 text-pink-400"
                  : "border-gray-700 text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setDevice("mobile")}
              title="Mobile"
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center bg-gray-950 py-6">
        <iframe
          srcDoc={doc}
          className="rounded-lg border shadow-lg bg-white transition-all duration-300"
          style={{
            width: typeof frameWidth === "number" ? `${frameWidth}px` : frameWidth,
            height: "700px",
            transform: "scale(1)",
            transformOrigin: "top center",
          }}
          title="Template Preview"
        />
      </div>
    </div>
  );
}
