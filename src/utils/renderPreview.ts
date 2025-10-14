import { ensureImageReferrerPolicy } from "@/lib/ensureImageReferrerPolicy";
import { injectThemeTokens } from "@/lib/injectThemeTokens";
import { renderTemplate } from "@/lib/renderTemplate";
import type { TemplateModuleDefinition } from "@/lib/templates";

type TemplateField = { id?: unknown; default?: unknown };
type TemplateSection = { fields?: unknown };
type TemplateTheme = { colors?: unknown; fonts?: unknown };

type TemplateMeta = {
  sections?: unknown;
  fields?: unknown;
  modules?: unknown;
  colors?: unknown;
  fonts?: unknown;
  themes?: unknown;
  theme?: { colors?: unknown; fonts?: unknown };
  content?: unknown;
};

export type PreviewTemplateInput = {
  html?: string | null;
  css?: string | null;
  meta?: TemplateMeta | null;
  assetsBasePath?: string | null;
};

export function renderPreview({ html, css, meta, assetsBasePath }: PreviewTemplateInput) {
  const templateHtml = typeof html === "string" ? html : "";
  const templateCss = typeof css === "string" ? css : "";
  const templateMeta = meta ?? {};

  const defaults = {
    ...extractFieldDefaults(templateMeta),
    ...extractContentDefaults(templateMeta),
  };

  const modules = extractModules(templateMeta);
  const rendered = renderTemplate({ html: templateHtml, values: defaults, modules });
  const withPolicy = ensureImageReferrerPolicy(rendered);

  const themed = injectThemeTokens({
    html: withPolicy,
    css: templateCss,
    colors: extractColorTokens(templateMeta),
    fonts: extractFontTokens(templateMeta),
  });

  return applyBaseHref(themed, assetsBasePath);
}

function extractFieldDefaults(meta: TemplateMeta) {
  const defaults: Record<string, string> = {};

  const sections = Array.isArray(meta.sections) ? (meta.sections as TemplateSection[]) : [];
  sections.forEach((section) => {
    if (!section || typeof section !== "object") return;
    const fields = Array.isArray((section as TemplateSection).fields)
      ? ((section as TemplateSection).fields as TemplateField[])
      : [];
    fields.forEach((field) => {
      const key = typeof field?.id === "string" ? field.id.trim() : "";
      if (!key) return;
      defaults[key] = toTemplateValue(field?.default);
    });
  });

  const fields = meta.fields;
  if (Array.isArray(fields)) {
    (fields as TemplateField[]).forEach((field) => {
      const key = typeof field?.id === "string" ? field.id.trim() : "";
      if (!key) return;
      defaults[key] = toTemplateValue(field?.default);
    });
  } else if (isRecord(fields)) {
    Object.entries(fields as Record<string, { default?: unknown }>).forEach(([key, value]) => {
      const trimmed = key.trim();
      if (!trimmed) return;
      defaults[trimmed] = toTemplateValue(value?.default);
    });
  }

  return defaults;
}

function extractContentDefaults(meta: TemplateMeta) {
  if (!isRecord(meta.content)) {
    return {};
  }

  return flattenContent(meta.content as Record<string, unknown>);
}

function flattenContent(value: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((acc, [key, current]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!path) return acc;

    if (isRecord(current)) {
      Object.assign(acc, flattenContent(current as Record<string, unknown>, path));
      return acc;
    }

    acc[path] = toTemplateValue(current);
    return acc;
  }, {});
}

function extractModules(meta: TemplateMeta) {
  if (!Array.isArray(meta.modules)) {
    return [] as TemplateModuleDefinition[];
  }

  return (meta.modules as unknown[]).filter(isRecord).map((module) => module as TemplateModuleDefinition);
}

function extractColorTokens(meta: TemplateMeta) {
  const tokens: Record<string, string> = {};

  const colors = meta.colors;
  if (Array.isArray(colors)) {
    colors.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const id = typeof (entry as { id?: unknown }).id === "string" ? (entry as { id?: string }).id : "";
      if (!id) return;
      tokens[id] = toTemplateValue((entry as { default?: unknown }).default);
    });
  } else if (isRecord(colors)) {
    Object.entries(colors as Record<string, unknown>).forEach(([key, value]) => {
      const trimmed = key.trim();
      if (!trimmed) return;
      tokens[trimmed] = toTemplateValue(value);
    });
  }

  const theme = selectTheme(meta);
  if (theme && isRecord(theme.colors)) {
    Object.entries(theme.colors as Record<string, unknown>).forEach(([key, value]) => {
      const trimmed = key.trim();
      if (!trimmed) return;
      tokens[trimmed] = toTemplateValue(value);
    });
  }

  return tokens;
}

function extractFontTokens(meta: TemplateMeta) {
  const tokens: Record<string, string> = {};

  const fonts = meta.fonts;
  if (Array.isArray(fonts)) {
    fonts.forEach((value) => {
      if (typeof value === "string") {
        tokens[value] = "";
      } else if (isRecord(value)) {
        const id = typeof (value as { id?: unknown }).id === "string" ? (value as { id?: string }).id : "";
        if (!id) return;
        tokens[id] = toTemplateValue((value as { default?: unknown }).default);
      }
    });
  } else if (isRecord(fonts)) {
    Object.entries(fonts as Record<string, unknown>).forEach(([key, value]) => {
      const trimmed = key.trim();
      if (!trimmed) return;
      tokens[trimmed] = toTemplateValue(value);
    });
  }

  const theme = selectTheme(meta);
  if (theme && isRecord(theme.fonts)) {
    Object.entries(theme.fonts as Record<string, unknown>).forEach(([key, value]) => {
      const trimmed = key.trim();
      if (!trimmed) return;
      tokens[trimmed] = toTemplateValue(value);
    });
  }

  return tokens;
}

function selectTheme(meta: TemplateMeta): TemplateTheme | null {
  if (meta.theme && typeof meta.theme === "object") {
    return meta.theme as TemplateTheme;
  }

  if (Array.isArray(meta.themes) && meta.themes.length > 0) {
    const theme = meta.themes[0];
    if (theme && typeof theme === "object") {
      return theme as TemplateTheme;
    }
  }

  return null;
}

function toTemplateValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
      .join("\n");
  }

  if (value == null) {
    return "";
  }

  return String(value);
}

function applyBaseHref(document: string, basePath: string | null | undefined) {
  if (!document) {
    return document;
  }

  if (!basePath || /^https?:\/\//i.test(basePath)) {
    return document;
  }

  const normalised = basePath.endsWith("/") ? basePath : `${basePath}/`;

  if (/<base\b[^>]*>/i.test(document)) {
    return document;
  }

  return document.replace(
    /<head([^>]*)>/i,
    (match) => `${match}\n    <base href="${normalised}" />`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
