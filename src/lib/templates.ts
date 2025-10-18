import type { Types } from "mongoose";

import {
  Template,
  type TemplateSchemaType,
  type TemplateVersion,
} from "@/models/template";
import { connectDB } from "@/lib/mongodb";
import { ensureTemplateFieldIds, normaliseTemplateFields } from "@/lib/templateFieldUtils";

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

type TemplateLeanDocument = TemplateSchemaType & { _id: Types.ObjectId };

export type TemplateRecord = Omit<TemplateLeanDocument, "_id" | "meta" | "versions"> & {
  _id: string;
  id: string;
  meta?: TemplateMeta;
  versions?: TemplateVersion[];
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
  js?: string;
  htmlUrl?: string;
  cssUrl?: string;
  jsUrl?: string;
  metaUrl?: string;
  previewUrl?: string;
  previewVideo?: string;
  activeVersion: TemplateVersion;
};

function resolvePreviewUrlFromRecord(
  record: {
    previewUrl?: string | null;
    image?: string | null;
    thumbnail?: string | null;
    meta?: TemplateMeta;
    id: string;
    _id: string;
  } & Partial<{ imageId?: string | null }>
): string | undefined {
  const normalise = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
    return undefined;
  };

  const directPreview = normalise(record.previewUrl);
  if (directPreview) {
    return directPreview;
  }

  const imagePreview = normalise(record.image);
  if (imagePreview) {
    return imagePreview;
  }

  const thumbnailPreview = normalise(record.thumbnail);
  if (thumbnailPreview) {
    return thumbnailPreview;
  }

  const metaId = normalise(record.meta?.id);
  const metaObjectId = normalise((record.meta as { _id?: string })?._id);
  const imageId = normalise((record as { imageId?: string | null }).imageId);

  const fallbackId = imageId ?? metaId ?? metaObjectId ?? normalise(record.id) ?? normalise(record._id);

  return fallbackId ? `/templates/${fallbackId}/preview.png` : undefined;
}

function normaliseId(template: TemplateLeanDocument): TemplateRecord {
  const { _id, ...rest } = template;
  const id = _id.toString();

  return {
    ...rest,
    _id: id,
    id,
  };
}

export async function getTemplates(category?: string): Promise<TemplateRecord[]> {
  await connectDB();
  const query = category ? { published: true, category } : { published: true };
  const templates = await Template.find(query).lean<TemplateLeanDocument[]>();
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
        parsed.fields = ensureTemplateFieldIds(parsed.fields);
        return parsed;
      }
    } catch (error) {
      console.error("⚠️ Failed to parse inline template meta", error);
    }
    return undefined;
  }

  if (typeof value === "object") {
    const meta = value as TemplateMeta;
    meta.fields = ensureTemplateFieldIds(meta.fields);
    return meta;
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

  const fallbackVersion: TemplateVersion = {
    number: template.currentVersion ?? "inline",
    previewUrl: template.previewUrl ?? undefined,
    previewVideo: template.previewVideo ?? undefined,
    htmlUrl: template.htmlUrl ?? undefined,
    cssUrl: template.cssUrl ?? undefined,
    jsUrl: template.jsUrl ?? undefined,
    metaUrl: template.metaUrl ?? undefined,
    inlineHtml: html || undefined,
    inlineCss: css || undefined,
    inlineJs: template.js || undefined,
    inlineMeta,
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  };

  return (
    template.versions?.find((v) => v.number === template.currentVersion) ??
    template.versions?.[template.versions.length - 1] ??
    fallbackVersion
  );
}

export async function getTemplateById(id: string): Promise<TemplateRecord | null> {
  await connectDB();
  const template = await Template.findById(id).lean<TemplateLeanDocument | null>();
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
    record.jsUrl = version.jsUrl ?? record.jsUrl;
    record.metaUrl = version.metaUrl ?? undefined;
    if (!record.html && typeof version.inlineHtml === "string" && version.inlineHtml.trim()) {
      record.html = version.inlineHtml;
    }
    if (!record.css && typeof version.inlineCss === "string" && version.inlineCss.trim()) {
      record.css = version.inlineCss;
    }
    if (!record.js && typeof version.inlineJs === "string") {
      const inlineJs = version.inlineJs;
      if (inlineJs.trim()) {
        record.js = inlineJs;
      }
    }
    if (!record.meta) {
      record.meta = parseMeta(version.inlineMeta);
    }
  }

  if (!record.html && typeof template.html === "string") {
    const inlineHtml = template.html;
    if (inlineHtml.trim()) {
      record.html = inlineHtml;
    }
  }

  if (!record.css && typeof template.css === "string") {
    const inlineCss = template.css;
    if (inlineCss.trim()) {
      record.css = inlineCss;
    }
  }

  if (!record.js && typeof template.js === "string") {
    const inlineJs = template.js;
    if (inlineJs.trim()) {
      record.js = inlineJs;
    }
  }

  if (!record.meta) {
    record.meta = parseMeta(template.meta);
  }

  try {
    if (!record.html && record.htmlUrl) {
      record.html = await fetch(record.htmlUrl).then((response) => response.text());
    }
    if (!record.css && record.cssUrl) {
      record.css = await fetch(record.cssUrl).then((response) => response.text());
    }
    if (!record.js && record.jsUrl) {
      record.js = await fetch(record.jsUrl).then((response) => response.text());
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

  const resolvedPreview = resolvePreviewUrlFromRecord(record);
  if (resolvedPreview) {
    record.previewUrl = resolvedPreview;
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
  const js = typeof template.js === "string" ? template.js : "";
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
  const fieldSource = ensureTemplateFieldIds(meta.fields);
  meta.fields = fieldSource;
  const fields = normaliseTemplateFields(fieldSource);
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
    js,
    htmlUrl: template.htmlUrl ?? version.htmlUrl ?? undefined,
    cssUrl: template.cssUrl ?? version.cssUrl ?? undefined,
    jsUrl: template.jsUrl ?? version.jsUrl ?? undefined,
    metaUrl: template.metaUrl ?? version.metaUrl ?? undefined,
    previewUrl: template.previewUrl ?? version.previewUrl ?? undefined,
    previewVideo: template.previewVideo ?? version.previewVideo ?? undefined,
    activeVersion: version,
  };

  const definitionPreview = resolvePreviewUrlFromRecord(definition);
  if (definitionPreview) {
    definition.previewUrl = definitionPreview;
  }

  return { template: definition, html, css, meta };
}
