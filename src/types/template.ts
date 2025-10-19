import type { TemplateFieldDefinition, TemplateModuleDefinition } from "@/lib/templates";

export type TemplateField = TemplateFieldDefinition;

export type TemplateMeta = {
  id?: string;
  name?: string;
  slug?: string;
  image?: string | null;
  previewUrl?: string | null;
  previewVideo?: string | null;
  themes?: Array<{
    name: string;
    colors: Record<string, string>;
    fonts?: Record<string, string>;
  }>;
  fields?:
    | TemplateFieldDefinition[]
    | Record<string, Partial<TemplateFieldDefinition> & { default?: unknown }>;
  modules?: TemplateModuleDefinition[];
};
