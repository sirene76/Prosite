import type { TemplateModuleDefinition } from "@/lib/templates";

export type RenderTemplateOptions = {
  html: string;
  values: Record<string, string>;
  modules?: TemplateModuleDefinition[];
};

export function renderTemplate({ html, values, modules = [] }: RenderTemplateOptions) {
  if (!html) return "";

  // Handle modules first
  const moduleMap = new Map<string, string>();
  modules.forEach((module) => {
    const key = `modules.${module.id}`;
    moduleMap.set(key, renderModule(module));
  });

  // Resolve nested paths like hero.image
  function resolvePath(obj: Record<string, unknown>, path: string): string {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
      if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return "";
      }
    }
    return typeof current === "string" ? current : "";
  }

  // Replace placeholders in HTML
  return html.replace(/{{(.*?)}}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return "";
    if (moduleMap.has(key)) return moduleMap.get(key) ?? "";
    return values[key] ?? resolvePath(values, key) ?? "";
  });
}

function renderModule(module: TemplateModuleDefinition) {
  const badge = '<span class="preview-badge">Preview Content</span>';
  const heading = module.label ? `<h3>${module.label}</h3>` : "";
  const description = module.description
    ? `<p>${module.description}</p>`
    : "<p>Placeholder content for this section.</p>";
  return `<section class='glass module-preview'>${badge}${heading}${description}</section>`;
}
