import type { LeanDocument } from "mongoose";

import { Template, type TemplateDocument } from "@/models/template";
import { connectDB } from "@/lib/mongodb";

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
  builder?: TemplateBuilderConfig;
  placeholders?: string[];
  content?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TemplateRecord = LeanDocument<TemplateDocument> & {
  _id: string;
  id: string;
};

export type TemplateDefinition = TemplateRecord & {
  sections: TemplateSectionDefinition[];
  colors: TemplateColorDefinition[];
  fonts: string[];
  modules: TemplateModuleDefinition[];
  meta: TemplateMeta;
  builder?: TemplateBuilderConfig;
  html?: string;
  css?: string;
};

function normaliseId(template: LeanDocument<TemplateDocument>): TemplateRecord {
  return {
    ...template,
    _id: template._id.toString(),
    id: template._id.toString(),
  } as TemplateRecord;
}

export async function getTemplates(): Promise<TemplateRecord[]> {
  await connectDB();
  const templates = await Template.find({ published: true }).lean();
  return templates.map(normaliseId);
}

export async function getTemplateById(id: string): Promise<TemplateRecord | null> {
  await connectDB();
  const template = await Template.findById(id).lean();
  return template ? normaliseId(template) : null;
}

export async function getTemplateAssets(id: string) {
  const template = await getTemplateById(id);
  if (!template) {
    return null;
  }

  const [html, css, meta] = await Promise.all([
    template.htmlUrl ? fetch(template.htmlUrl).then((r) => r.text()) : Promise.resolve(""),
    template.cssUrl ? fetch(template.cssUrl).then((r) => r.text()) : Promise.resolve(""),
    template.metaUrl
      ? fetch(template.metaUrl)
          .then((r) => r.json())
          .catch(() => ({} as TemplateMeta))
      : Promise.resolve({} as TemplateMeta),
  ]);

  const sections = Array.isArray((meta as TemplateMeta).sections)
    ? ((meta as TemplateMeta).sections as TemplateSectionDefinition[])
    : [];
  const colors = Array.isArray((meta as TemplateMeta).colors)
    ? ((meta as TemplateMeta).colors as TemplateColorDefinition[])
    : [];
  const fonts = Array.isArray((meta as TemplateMeta).fonts)
    ? ((meta as TemplateMeta).fonts as string[])
    : [];
  const modules = Array.isArray((meta as TemplateMeta).modules)
    ? ((meta as TemplateMeta).modules as TemplateModuleDefinition[])
    : [];
  const builder = (meta as TemplateMeta).builder;

  const definition: TemplateDefinition = {
    ...template,
    sections,
    colors,
    fonts,
    modules,
    meta: (meta as TemplateMeta) ?? {},
    builder,
    html,
    css,
  };

  return { template: definition, html, css, meta };
}
