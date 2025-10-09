"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { TemplateMeta, TemplateTheme } from "@/hooks/useTemplatePreview";

type TemplateLivePreviewProps = {
  html: string;
  css: string;
  meta?: TemplateMeta | Record<string, unknown> | null;
};

export default function TemplateLivePreview({ html, css, meta }: TemplateLivePreviewProps) {
  const themes = useMemo<TemplateTheme[]>(() => (Array.isArray(meta?.themes) ? meta.themes : []), [meta]);
  const [activeTheme, setActiveTheme] = useState<TemplateTheme | null>(themes[0] || null);
  const [renderedDoc, setRenderedDoc] = useState<string>("");

  useEffect(() => {
    setActiveTheme(themes[0] || null);
  }, [themes]);

  const generateDoc = useCallback(() => {
    if (!html) return "";
    const colors = activeTheme?.colors || {};
    const vars = Object.entries(colors)
      .map(([key, value]) => `--${key}: ${value};`)
      .join(" ");

    const cssBlock = css ? css : "";

    return `
      <html>
        <head><style>:root { ${vars} } ${cssBlock}</style></head>
        <body>${html}</body>
      </html>`;
  }, [html, css, activeTheme]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRenderedDoc(generateDoc());
    }, 300);

    return () => clearTimeout(timeout);
  }, [generateDoc, html, css, meta]);

  if (!html) {
    return (
      <div className="border rounded-lg bg-gray-900/40 p-6 text-sm text-gray-400">
        Start adding HTML to see the live preview.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
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
      <iframe
        key={activeTheme?.name || "default"}
        srcDoc={renderedDoc}
        className="w-full h-[650px] bg-white border-t shadow-inner"
        title="Template Preview"
      />
    </div>
  );
}
