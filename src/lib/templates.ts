import type { LeanDocument } from "mongoose";

import { Template, type TemplateDocument, type TemplateVersion } from "@/models/template";
import { connectDB } from "@/lib/mongodb";
import { normaliseTemplateFields } from "@/lib/templateFieldUtils";

export type TemplateFieldType = "text" | "textarea" | "image" | "gallery" | "color" | "email";

export type TemplateFieldDefinition = {
  id: string;
  label?: string;
  type?: TemplateFieldType | string;
  placeholder?: string;
  default?: string;
  description?: string;
};

export type TemplateSectionDefinition = {
  id: string;
  label?: string;
  description?: string;
  fields: TemplateFieldDefinition[];
};

export type TemplateColorDefinition = {
  id: string;
  label?: string;
  default?: string;
};

export type TemplateModuleDefinition = {
  id: string;
  label?: string;
  type?: "form" | "iframe" | "integration" | string;
  description?: string;
  url?: string;
  height?: number;
};

export type TemplateBuilderPanel = {
  id: string;
  label: string;
  type: "image-grid" | "table-editor" | "text-list";
  storageKey: string;
  limit?: number;
  fields?: string[];
};

export type TemplateBuilderConfig = {
  showTheme?: boolean;
  showPages?: boolean;
  layout?: "one-column" | "two-column";
  accentColor?: string;
  customPanels?: TemplateBuilderPanel[];
};

export type TemplateMeta = {
  sections?: TemplateSectionDefinition[];
  colors?: TemplateColorDefinition[];
  fonts?: string[];
  modules?: TemplateModuleDefinition[];
  fields?:
    | TemplateFieldDefinition[]
    | Record<string, Partial<TemplateFieldDefinition> & { default?: unknown }>;
  builder?: TemplateBuilderConfig;
  placeholders?: string[];
  content?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TemplateRecord = LeanDocument<TemplateDocument> & {
  _id: string;
  id: string;
  image?: string;
  thumbnail?: string;
  previewUrl?: string;
  previewVideo?: string;
  htmlUrl?: string;
  cssUrl?: string;
  metaUrl?: string;
  html?: string;
  css?: string;
  meta?: TemplateMeta;
};

export type TemplateDefinition = TemplateRecord & {
  sections: TemplateSectionDefinition[];
  colors: TemplateColorDefinition[];
  fonts: string[];
  modules: TemplateModuleDefinition[];
  fields: TemplateFieldDefinition[];
  meta: TemplateMeta;
  builder?: TemplateBuilderConfig;
  html?: string;
  css?: string;
  htmlUrl?: string;
  cssUrl?: string;
  metaUrl?: string;
  previewUrl?: string;
  previewVideo?: string;
  activeVersion: TemplateVersion;
};

function normaliseId(template: LeanDocument<TemplateDocument>): TemplateRecord {
  return {
    ...template,
    _id: template._id.toString(),
    id: template._id.toString(),
  } as TemplateRecord;
}

export async function getTemplates(category?: string): Promise<TemplateRecord[]> {
  await connectDB();
  const query = category ? { published: true, category } : { published: true };
  const templates = await Template.find(query).lean();
  return templates.map(normaliseId);
}

function parseMeta(value: unknown): TemplateMeta | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as TemplateMeta;
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      console.error("⚠️ Failed to parse inline template meta", error);
    }
    return undefined;
  }

  if (typeof value === "object") {
    return value as TemplateMeta;
  }

  return undefined;
}

export function resolveActiveTemplateVersion(
  template: TemplateRecord,
  html: string,
  css: string,
  meta: TemplateMeta
): TemplateVersion {
  const fallbackTimestampSource = template.updatedAt ?? template.createdAt ?? new Date();
  const fallbackTimestamp =
    fallbackTimestampSource instanceof Date
      ? fallbackTimestampSource
      : new Date(fallbackTimestampSource);

  const inlineMeta = meta && Object.keys(meta).length > 0 ? meta : undefined;

  const fallbackVersion = {
    number: template.currentVersion ?? "inline",
    previewUrl: template.previewUrl ?? undefined,
    previewVideo: template.previewVideo ?? undefined,
    htmlUrl: template.htmlUrl ?? undefined,
    cssUrl: template.cssUrl ?? undefined,
    metaUrl: template.metaUrl ?? undefined,
    inlineHtml: html || undefined,
    inlineCss: css || undefined,
    inlineMeta,
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  } as TemplateVersion;

  return (
    template.versions?.find((v) => v.number === template.currentVersion) ??
    template.versions?.[template.versions.length - 1] ??
    fallbackVersion
  );
}

export async function getTemplateById(id: string): Promise<TemplateRecord | null> {
  await connectDB();
  const template = await Template.findById(id).lean();
  if (!template) {
    return null;
  }

  const record = normaliseId(template);
  const version =
    record.versions?.find((v) => v.number === record.currentVersion) ??
    record.versions?.[record.versions.length - 1];
  if (version) {
    record.previewUrl = version.previewUrl ?? undefined;
    record.previewVideo = version.previewVideo ?? undefined;
    record.htmlUrl = version.htmlUrl ?? undefined;
    record.cssUrl = version.cssUrl ?? undefined;
    record.metaUrl = version.metaUrl ?? undefined;
    if (!record.html && typeof version.inlineHtml === "string" && version.inlineHtml.trim()) {
      record.html = version.inlineHtml;
    }
    if (!record.css && typeof version.inlineCss === "string" && version.inlineCss.trim()) {
      record.css = version.inlineCss;
    }
    if (!record.meta) {
      record.meta = parseMeta(version.inlineMeta);
    }
  }

  if (!record.html && typeof (template as { html?: unknown }).html === "string") {
    const inlineHtml = (template as { html?: unknown }).html as string;
    if (inlineHtml.trim()) {
      record.html = inlineHtml;
    }
  }

  if (!record.css && typeof (template as { css?: unknown }).css === "string") {
    const inlineCss = (template as { css?: unknown }).css as string;
    if (inlineCss.trim()) {
      record.css = inlineCss;
    }
  }

  if (!record.meta) {
    record.meta = parseMeta((template as { meta?: unknown }).meta);
  }

  try {
    if (!record.html && record.htmlUrl) {
      record.html = await fetch(record.htmlUrl).then((response) => response.text());
    }
    if (!record.css && record.cssUrl) {
      record.css = await fetch(record.cssUrl).then((response) => response.text());
    }
    if (!record.meta && record.metaUrl) {
      const fetchedMeta = await fetch(record.metaUrl).then((response) => response.json());
      record.meta = typeof fetchedMeta === "object" && fetchedMeta ? (fetchedMeta as TemplateMeta) : undefined;
    }
  } catch (error) {
    console.error("⚠️ Failed to fetch legacy template files", error);
  }

  if (!record.meta) {
    record.meta = {} as TemplateMeta;
  }

  return record;
}

export async function getTemplateAssets(id: string) {
  const template = await getTemplateById(id);
  if (!template) {
    return null;
  }

  const html = typeof template.html === "string" ? template.html : "";
  const css = typeof template.css === "string" ? template.css : "";
  const meta = (template.meta ?? {}) as TemplateMeta;
  const version = resolveActiveTemplateVersion(template, html, css, meta);

  const sections = Array.isArray(meta.sections)
    ? (meta.sections as TemplateSectionDefinition[])
    : [];
  const colors = Array.isArray(meta.colors)
    ? (meta.colors as TemplateColorDefinition[])
    : [];
  const fonts = Array.isArray(meta.fonts)
    ? (meta.fonts as string[])
    : [];
  const modules = Array.isArray(meta.modules)
    ? (meta.modules as TemplateModuleDefinition[])
    : [];
  const fields = normaliseTemplateFields(meta.fields);
  const builder = meta.builder;

  const definition: TemplateDefinition = {
    ...template,
    sections,
    colors,
    fonts,
    modules,
    fields,
    meta,
    builder,
    html,
    css,
    htmlUrl: template.htmlUrl ?? version.htmlUrl ?? undefined,
    cssUrl: template.cssUrl ?? version.cssUrl ?? undefined,
    metaUrl: template.metaUrl ?? version.metaUrl ?? undefined,
    previewUrl: template.previewUrl ?? version.previewUrl ?? undefined,
    previewVideo: template.previewVideo ?? version.previewVideo ?? undefined,
    activeVersion: version,
  };

  return { template: definition, html, css, meta };
}
