import type { TemplateModuleDefinition } from "@/lib/templates";

export type RenderTemplateOptions = {
  html: string;
  values: Record<string, string>;
  modules?: TemplateModuleDefinition[];
};

export function renderTemplate({ html, values, modules = [] }: RenderTemplateOptions) {
  if (!html) return "";

  const moduleMap = new Map<string, string>();
  modules.forEach((module) => {
    const key = `modules.${module.id}`;
    moduleMap.set(key, renderModule(module));
  });

  // Replace {{ field }} placeholders
  return html.replace(/{{(.*?)}}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return "";

    if (moduleMap.has(key)) return moduleMap.get(key) ?? "";

    // fallback to values map
    return values[key] ?? "";
  });
}

function renderModule(module: TemplateModuleDefinition) {
  const heading = module.label ? `<h3>${module.label}</h3>` : "";
  const description = module.description ? `<p>${module.description}</p>` : "";
  return `<section class="module-block">${heading}${description}</section>`;
}
