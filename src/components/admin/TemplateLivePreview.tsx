"use client";

import { useState, useEffect } from "react";

export default function TemplateLivePreview({ html, css, meta }: any) {
  const [activeTheme, setActiveTheme] = useState(meta?.themes?.[0] || null);
  const [doc, setDoc] = useState("");

  // 🧩 Helper: Build CSS variable string from theme
  const buildThemeCSS = (theme: any) => {
    if (!theme?.colors) return "";
    return Object.entries(theme.colors)
      .map(([key, value]) => `--${key}: ${value};`)
      .join(" ");
  };

  // 🧩 Debounced re-render effect for smooth updates
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!html || !css) return;

      const themeVars = buildThemeCSS(activeTheme);

      const docHTML = `
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              :root { ${themeVars} }
              ${css}
            </style>
          </head>
          <body>${html}</body>
        </html>
      `;

      setDoc(docHTML);
    }, 200); // debounce for typing or theme switching
    return () => clearTimeout(timeout);
  }, [html, css, activeTheme]);

  // 🧩 Auto-reset active theme when meta changes
  useEffect(() => {
    if (meta?.themes?.length && !activeTheme) {
      setActiveTheme(meta.themes[0]);
    }
  }, [meta, activeTheme]);

  // 🧩 Render UI
  if (!html) {
    return (
      <div className="text-gray-400 text-sm p-6 text-center">
        Write HTML & CSS to see the live preview.
      </div>
    );
  }

  return (
    <div className="mt-6 border border-gray-800 rounded-lg overflow-hidden bg-gray-900">
      <div className="flex items-center justify-between bg-gray-950 px-4 py-2 border-b border-gray-800">
        <span className="text-gray-200 text-sm font-medium">Live Preview</span>
        {meta?.themes?.length > 0 && (
          <select
            value={activeTheme?.name}
            onChange={(e) =>
              setActiveTheme(meta.themes.find((t: any) => t.name === e.target.value))
            }
            className="bg-gray-800 text-gray-100 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
          >
            {meta.themes.map((t: any) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-gray-100 flex justify-center py-6">
        <iframe
          srcDoc={doc}
          className="rounded-md shadow-md bg-white transition-all duration-300"
          style={{ width: "100%", height: "700px", border: "none" }}
          title="Template Preview"
        />
      </div>
    </div>
  );
}
