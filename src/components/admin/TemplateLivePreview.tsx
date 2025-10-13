"use client";
import { useEffect, useMemo, useState } from "react";

import type { TemplateModuleDefinition } from "@/lib/templates";
import { renderTemplate } from "@/lib/renderTemplate";

type TemplateTheme = {
  name: string;
  colors?: Record<string, string>;
};

type TemplateField = {
  id?: string;
  default?: unknown;
};

type TemplateMeta = {
  themes?: TemplateTheme[];
  fields?: TemplateField[];
  modules?: TemplateModuleDefinition[];
};

type TemplateLivePreviewProps = {
  html: string;
  css: string;
  meta?: TemplateMeta | null;
};

export default function TemplateLivePreview({ html, css, meta }: TemplateLivePreviewProps) {
  const [activeTheme, setActiveTheme] = useState<TemplateTheme | null>(() => meta?.themes?.[0] ?? null);
  const [doc, setDoc] = useState("");
  const themes = meta?.themes ?? [];
  const fields = useMemo(() => getTemplateFields(meta), [meta]);
  const modules = useMemo(() => getTemplateModules(meta), [meta]);

  // Debounced document re-render
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!html || !css) return;

      const renderedHtml = renderWithDefaults({ html, fields, modules });
      const themeVars = activeTheme?.colors
        ? Object.entries(activeTheme.colors)
            .map(([key, value]) => `--${key}: ${value};`)
            .join(" ")
        : "";

      // ✅ Put author CSS first, then theme variables last so they override
      const docHTML = `
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style id="author-css">
              ${css}
            </style>
            <style id="theme-vars">
              :root { ${themeVars} }
            </style>
          </head>
          <body>${renderedHtml}</body>
        </html>
      `;
      setDoc(docHTML);
    }, 200);
    return () => clearTimeout(timeout);
  }, [html, css, activeTheme, fields, modules]);

  // Auto-reset active theme when meta changes
  useEffect(() => {
    const metaThemes = meta?.themes ?? [];
    if (!metaThemes.length) {
      setActiveTheme(null);
      return;
    }
    const stillValid = activeTheme ? metaThemes.some((theme) => theme.name === activeTheme.name) : false;
    if (!stillValid) setActiveTheme(metaThemes[0]);
  }, [meta, activeTheme]);

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
        {themes.length ? (
          <select
            value={activeTheme?.name}
            onChange={(event) => {
              const nextTheme = themes.find((theme) => theme.name === event.target.value) ?? null;
              setActiveTheme(nextTheme);
            }}
            className="bg-gray-800 text-gray-100 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
          >
            {themes.map((theme) => (
              <option key={theme.name} value={theme.name}>
                {theme.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="bg-gray-100 flex justify-center py-6">
        <iframe
          srcDoc={doc}
          className="rounded-md shadow-md bg-white transition-all duration-300"
          style={{
            width: "100%",
            height: "700px",
            border: "none",
          }}
          title="Template Preview"
        />
      </div>
    </div>
  );
}

function getTemplateFields(meta: TemplateMeta | null | undefined): TemplateField[] {
  if (!meta?.fields || !Array.isArray(meta.fields)) {
    return [];
  }

  return meta.fields.filter((field): field is TemplateField => !!field && typeof field === "object");
}

function getTemplateModules(meta: TemplateMeta | null | undefined): TemplateModuleDefinition[] {
  if (!meta?.modules || !Array.isArray(meta.modules)) {
    return [];
  }

  return meta.modules.filter((module): module is TemplateModuleDefinition => !!module && typeof module === "object");
}

function renderWithDefaults({
  html,
  fields,
  modules,
}: {
  html: string;
  fields: TemplateField[];
  modules: TemplateModuleDefinition[];
}) {
  if (!html) {
    return "";
  }

  const defaults = fields.reduce<Record<string, string>>((acc, field) => {
    if (typeof field.id !== "string" || !field.id.trim()) {
      return acc;
    }

    const key = field.id.trim();
    const defaultValue = field.default;

    if (typeof defaultValue === "string") {
      acc[key] = defaultValue;
      return acc;
    }

    if (Array.isArray(defaultValue)) {
      const flattened = defaultValue
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0);
      acc[key] = flattened.join("\n");
      return acc;
    }

    if (defaultValue == null) {
      acc[key] = "";
      return acc;
    }

    acc[key] = String(defaultValue);
    return acc;
  }, {});

  return renderTemplate({
    html,
    values: defaults,
    modules,
  });
}
