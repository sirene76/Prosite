"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    setActiveTheme(themes[0] || null);
  }, [themes]);

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
    return <div className="p-6 text-gray-500">Upload HTML & CSS to see live preview.</div>;
  }

  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
        <span className="text-gray-200 text-sm font-medium">Live Preview</span>
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
      </div>
      <iframe srcDoc={doc} className="w-full h-[600px] bg-white border-t shadow-inner" title="Template Preview" />
    </div>
  );
}
