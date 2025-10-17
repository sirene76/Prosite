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

  // Resolve nested paths like hero.image and ensure we always return a string
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
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item : String(item)))
        .join("\n");
    }
    return String(value);
  };

  // Replace placeholders in HTML
  const rendered = html.replace(/{{(.*?)}}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return "";
    if (moduleMap.has(key)) return moduleMap.get(key) ?? "";

    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return toStringValue(values[key]);
    }

    const nestedValue = resolvePath(values, key);
    if (nestedValue !== undefined) {
      return toStringValue(nestedValue);
    }

    return "";
  });

  return ensureModuleAnchors(rendered, modules);
}

function renderModule(module: TemplateModuleDefinition) {
  const badge = '<span class="preview-badge">Preview Content</span>';
  const heading = module.label ? `<h3>${module.label}</h3>` : "";
  const description = module.description
    ? `<p>${module.description}</p>`
    : "<p>Placeholder content for this section.</p>";
  const moduleId = typeof module.id === "string" ? module.id.trim() : "";
  const escapedId = moduleId ? escapeHtmlAttribute(moduleId) : "";
  const attributes = ["class=\"glass module-preview\""];
  if (moduleId) {
    attributes.unshift(`id=\"${escapedId}\"`);
    attributes.push(`data-module-id=\"${escapedId}\"`);
  }

  return `<section ${attributes.join(" ")}>${badge}${heading}${description}</section>`;
}

function ensureModuleAnchors(
  html: string,
  modules: TemplateModuleDefinition[]
) {
  if (!html || !modules.length) {
    return html;
  }

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
    if (!moduleId) {
      return output;
    }

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
            : `${withModuleId} id=\"${escapedId}\"`;
          return `${start}${withId}${end}`;
        }
      );
    }, output);
  }, html);
}

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
  return `${attributes} ${name}=\"${value}\"`;
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
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}
