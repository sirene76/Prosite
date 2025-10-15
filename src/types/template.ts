export type TemplateField = {
  label: string;
  type: "text" | "textarea" | "image" | "color" | "select";
  default?: string;
  options?: string[];
};

export type TemplateMeta = {
  id?: string;
  name?: string;
  slug?: string;
  themes?: Array<{
    name: string;
    colors: Record<string, string>;
    fonts?: Record<string, string>;
  }>;
  fields?: Record<string, TemplateField>;
  modules?: import("@/lib/templates").TemplateModuleDefinition[];
};
