import type { TemplateModuleDefinition } from "@/lib/templates";

export type RenderTemplateOptions = {
  html: string;
  values?: Record<string, unknown>;
  modules?: TemplateModuleDefinition[];
};

/**
 * renderTemplate
 * Renders {{tokens}} inside HTML using values from Website (content + values).
 * Supports nested keys like hero.title or content.businessName.
 * Integrates module previews if provided.
 */
export function renderTemplate({
  html,
  values = {},
  modules = [],
}: RenderTemplateOptions) {
  if (!html) return "";

  // ---------- MODULES HANDLING ----------
  const moduleMap = new Map<string, string>();
  modules.forEach((module) => {
    const key = `modules.${module.id}`;
    moduleMap.set(key, renderModule(module));
  });

  // ---------- UTILITIES ----------
  const resolvePath = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
      if (
        current &&
        typeof current === "object" &&
        part in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const toStringValue = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      return value.map((v) => toStringValue(v)).join("\n");
    }
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // ---------- FLATTEN VALUES ----------
  const flatten = (obj: Record<string, any>, prefix = ""): Record<string, string> => {
    return Object.entries(obj).reduce((acc, [key, val]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        Object.assign(acc, flatten(val, fullKey));
      } else if (val != null) {
        acc[fullKey] = toStringValue(val);
      }
      return acc;
    }, {} as Record<string, string>);
  };

  const flatValues = flatten(values);

  // ---------- REPLACE PLACEHOLDERS ----------
  let rendered = html.replace(/{{\s*(.*?)\s*}}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return "";

    // 1. Module slot replacement
    if (moduleMap.has(key)) return moduleMap.get(key) ?? "";

    // 2. Direct match from flattened values
    if (flatValues[key] !== undefined) return flatValues[key];

    // 3. Try nested object access (redundant safety)
    const nested = resolvePath(values, key);
    if (nested !== undefined) return toStringValue(nested);

    return "";
  });

  // ---------- MODULE ANCHORS ----------
  rendered = ensureModuleAnchors(rendered, modules);

  return rendered;
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function renderModule(module: TemplateModuleDefinition) {
  const badge = '<span class="preview-badge">Preview Content</span>';
  const heading = module.label ? `<h3>${module.label}</h3>` : "";
  const description = module.description
    ? `<p>${module.description}</p>`
    : "<p>Placeholder content for this section.</p>";
  const moduleId = typeof module.id === "string" ? module.id.trim() : "";
  const escapedId = moduleId ? escapeHtmlAttribute(moduleId) : "";
  const attributes = ['class="glass module-preview"'];
  if (moduleId) {
    attributes.unshift(`id="${escapedId}"`);
    attributes.push(`data-module-id="${escapedId}"`);
  }

  return `<section ${attributes.join(" ")}>${badge}${heading}${description}</section>`;
}

function ensureModuleAnchors(html: string, modules: TemplateModuleDefinition[]) {
  if (!html || !modules.length) return html;

  const attributesToMatch = [
    "data-module-id",
    "data-builder-section",
    "data-builder-section-id",
    "data-section-id",
    "data-scroll-anchor",
    "data-anchor",
    "id",
  ];

  return modules.reduce<string>((output, module) => {
    const moduleId = typeof module.id === "string" ? module.id.trim() : "";
    if (!moduleId) return output;

    const attributePattern = escapeRegExp(moduleId);
    const escapedId = escapeHtmlAttribute(moduleId);

    return attributesToMatch.reduce<string>((currentHtml, attribute) => {
      const regex = new RegExp(
        `(<[a-zA-Z0-9:-]+)([^>]*\\s${attribute}=(['"])${attributePattern}\\3[^>]*)(>)`,
        "gi"
      );

      return currentHtml.replace(
        regex,
        (_match, start: string, attrs: string, _quote: string, end: string) => {
          const withModuleId = upsertAttribute(attrs, "data-module-id", escapedId);
          const withId = hasAttribute(withModuleId, "id")
            ? withModuleId
            : `${withModuleId} id="${escapedId}"`;
          return `${start}${withId}${end}`;
        }
      );
    }, output);
  }, html);
}

/* ---------- Attribute + Escaping Utilities ---------- */

function hasAttribute(attributes: string, name: string) {
  const pattern = new RegExp(`\\s${name}\\s*=`, "i");
  return pattern.test(attributes);
}

function upsertAttribute(attributes: string, name: string, value: string) {
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(['"])(.*?)\\2`, "i");
  if (pattern.test(attributes)) {
    return attributes.replace(pattern, (_match, prefix: string, quote: string) => {
      return `${prefix}${quote}${value}${quote}`;
    });
  }
  return `${attributes} ${name}="${value}"`;
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
