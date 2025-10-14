export type TemplateField = {
  label: string;
  type: "text" | "textarea" | "image" | "color" | "select";
  default?: string;
  options?: string[];
};

export type TemplateMeta = {
  id?: string;
  name?: string;
  fields?: Record<string, TemplateField>;
  modules?: import("@/lib/templates").TemplateModuleDefinition[];
};
