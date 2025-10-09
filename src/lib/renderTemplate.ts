import type { ThemeState } from "@/context/BuilderContext";
import type { TemplateModuleDefinition } from "@/lib/templates";

export type RenderTemplateOptions = {
  html: string;
  values: Record<string, unknown>;
  modules?: TemplateModuleDefinition[];
  theme?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  css?: string;
  themeTokens?: {
    colors?: Record<string, string | undefined>;
    fonts?: Record<string, string | undefined>;
  };
};

export function renderTemplate({
  html,
  values,
  modules = [],
  theme,
  css,
  themeTokens,
}: RenderTemplateOptions) {
  if (!html) return "";

  // --- Inject absolute asset paths dynamically ---
  let processedHtml = html;
  const inlineCss = css ?? "";

  if (inlineCss.trim()) {
    const colorTokens: Record<string, string | undefined> = {
      ...(themeTokens?.colors ?? {}),
    };

    if (theme?.primary && !colorTokens.primary) {
      colorTokens.primary = theme.primary;
    }
    if (theme?.secondary && !colorTokens.secondary) {
      colorTokens.secondary = theme.secondary;
    }
    if (theme?.background && !colorTokens.background) {
      colorTokens.background = theme.background;
    }
    if (theme?.text && !colorTokens.text) {
      colorTokens.text = theme.text;
    }

    processedHtml = injectThemeTokens({
      html: processedHtml,
      css: inlineCss,
      templateId: undefined,
      colors: colorTokens,
      fonts: themeTokens?.fonts,
    });
  }

  const moduleMap = new Map<string, string>();
  modules.forEach((module) => {
    const key = `modules.${module.id}`;
    moduleMap.set(key, renderModule(module));
  });

  const contentForRendering: Record<string, unknown> = { ...values };

  if (moduleMap.size > 0) {
    const modulesContent: Record<string, unknown> =
      typeof contentForRendering.modules === "object" && contentForRendering.modules !== null
        ? { ...(contentForRendering.modules as Record<string, unknown>) }
        : {};

    moduleMap.forEach((markup, key) => {
      contentForRendering[key] = markup;
      const [, moduleKey] = key.split(".");
      if (moduleKey) {
        modulesContent[moduleKey] = markup;
      }
    });

    contentForRendering.modules = modulesContent;
  }

  const rendered = renderWithContent(processedHtml, contentForRendering, {
    moduleMap,
  });

  const colorVars = buildThemeVariables(theme, themeTokens?.fonts);
  if (!colorVars) {
    return rendered;
  }

  if (/<body[^>]*>/i.test(rendered)) {
    return rendered.replace(/<body([^>]*)>/i, `<body$1>${colorVars}`);
  }

  return `${colorVars}${rendered}`;
}

function injectInlineCss(html: string, css: string) {
  if (!css.trim()) {
    return html;
  }

  const styleTag = `<style>${css}</style>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${styleTag}`);
  }

  return `${styleTag}${html}`;
}

export function applyThemeTokens(html: string, css: string, theme: ThemeState) {
  let themedCss = css || "";

  Object.entries(theme.colors ?? {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    const pattern = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g");
    themedCss = themedCss.replace(pattern, value);
  });

  Object.entries(theme.fonts ?? {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    const pattern = new RegExp(`{{\\s*font\\.${escapeRegExp(key)}\\s*}}`, "g");
    themedCss = themedCss.replace(pattern, value);
  });

  return { html, css: themedCss };
}

type RenderContext = {
  moduleMap?: Map<string, string>;
};

export function renderWithContent(
  html: string,
  content: Record<string, unknown>,
  context: RenderContext = {}
) {
  if (!html) {
    return html;
  }

  const eachBlockRe = /{{#each\s+([\w.]+)\s*}}([\s\S]*?){{\/each}}/g;
  let output = html.replace(eachBlockRe, (_, keyPath: string, block: string) => {
    const list = resolvePath(content, keyPath);
    if (!Array.isArray(list)) {
      return "";
    }

    return list
      .map((item) => {
        const scope = createScope(item);
        return renderWithContent(block, scope, context);
      })
      .join("");
  });

  output = replaceScalars(output, content, context);

  return output;
}

function replaceScalars(
  template: string,
  scope: Record<string, unknown>,
  context: RenderContext
) {
  const { moduleMap } = context;

  return template.replace(/{{(.*?)}}/g, (match: string, rawKey: string) => {
    const key = rawKey.trim();
    if (!key || /^[#\/!>{]/.test(key)) {
      return match;
    }

    if (moduleMap?.has(key)) {
      return moduleMap.get(key) ?? "";
    }

    const value = resolvePath(scope, key);

    if (value === undefined || value === null || value === "") {
      return `[${key}]`;
    }

    return formatScalar(value, key);
  });
}

function formatScalar(value: unknown, keyPath: string) {
  if (Array.isArray(value)) {
    const images = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
      .map((item) =>
        createImageMarkup(item, {
          alt: "Gallery Image",
        })
      )
      .filter((item) => item.length > 0);

    if (images.length > 0) {
      return images.join("");
    }

    return `[${keyPath}]`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return `[${keyPath}]`;
    }

    if (isImageUrl(trimmed)) {
      return createImageMarkup(trimmed, { alt: keyPath });
    }

    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return `[${keyPath}]`;
}

function createScope(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>), this: value };
  }
  return { ".": value, this: value } as Record<string, unknown>;
}

function resolvePath(obj: unknown, path: string): unknown {
  if (!path) {
    return undefined;
  }

  if (path === "." || path === "this") {
    return obj;
  }

  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    if (Object.prototype.hasOwnProperty.call(obj, path)) {
      return (obj as Record<string, unknown>)[path];
    }
  }

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (!part) {
      continue;
    }

    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isFinite(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (current && typeof current === "object") {
      if (Object.prototype.hasOwnProperty.call(current, part)) {
        current = (current as Record<string, unknown>)[part];
        continue;
      }
      return undefined;
    }

    return undefined;
  }

  return current;
}

function escapeAttribute(value: string) {
  return value.replace(/[&"'<>]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return char;
    }
  });
}

function isImageUrl(value: string) {
  if (!/^https?:\/\//i.test(value)) {
    return false;
  }

  return /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(value);
}

function createImageMarkup(url: string, options: { alt?: string }) {
  if (!isImageUrl(url)) {
    return "";
  }

  const safeUrl = escapeAttribute(url);
  const alt = escapeAttribute(options.alt ?? "Image");

  return `<img src="${safeUrl}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block;"/>`;
}

export function composePreviewDocument(
  html: string,
  css: string,
  theme: ThemeState,
  content: Record<string, unknown>
) {
  const themed = applyThemeTokens(html, css, theme);
  const htmlWithContent = renderWithContent(themed.html, content);
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${themed.css || ""}</style>
      </head>
      <body>${htmlWithContent}</body>
    </html>
  `;
}

type ThemeTokenMap = Record<string, string | undefined> | undefined;

export function injectThemeTokens({
  html,
  css,
  colors,
  fonts,
}: {
  html: string;
  css?: string;
  colors?: ThemeTokenMap;
  fonts?: ThemeTokenMap;
}) {
  if (!css || !css.trim()) {
    return html;
  }

  const replacements: Array<[RegExp, string]> = [];

  Object.entries(colors ?? {}).forEach(([key, value]) => {
    const token = typeof value === "string" ? value.trim() : "";
    if (!token) {
      return;
    }
    replacements.push([new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "gi"), token]);
  });

  Object.entries(fonts ?? {}).forEach(([key, value]) => {
    const token = typeof value === "string" ? value.trim() : "";
    if (!token) {
      return;
    }
    replacements.push([new RegExp(`{{\\s*font\\.${escapeRegExp(key)}\\s*}}`, "gi"), token]);
  });

  let themedCss = css;
  replacements.forEach(([pattern, replacement]) => {
    themedCss = themedCss.replace(pattern, replacement);
  });

  return injectInlineCss(html, themedCss);
}

function buildThemeVariables(
  theme: RenderTemplateOptions["theme"],
  fonts?: Record<string, string | undefined>
) {
  if (!theme && !fonts) {
    return "";
  }

  const tokens: string[] = [];

  if (theme?.primary) {
    tokens.push(`--color-primary: ${theme.primary};`);
  }
  if (theme?.secondary) {
    tokens.push(`--color-secondary: ${theme.secondary};`);
  }
  if (theme?.background) {
    tokens.push(`--color-bg: ${theme.background};`);
  }
  if (theme?.text) {
    tokens.push(`--color-text: ${theme.text};`);
  }

  Object.entries(fonts ?? {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    tokens.push(`--font-${key}: ${value};`);
  });

  if (!tokens.length) {
    return "";
  }

  return `\n<style>\n  :root {\n    ${tokens.join("\n    ")}\n  }\n</style>\n`;
}

function renderModule(module: TemplateModuleDefinition) {
  const heading = module.label ? `<h3>${module.label}</h3>` : "";
  const description = module.description ? `<p>${module.description}</p>` : "";

  if (module.type === "iframe") {
    if (!module.url) {
      return `${heading}${description}`;
    }
    const height = module.height ? ` style=\"min-height:${module.height}px\"` : "";
    return `${heading}${description}<iframe src="${module.url}" title="${module.label ?? "Embedded content"}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"${height} loading="lazy"></iframe>`;
  }

  if (module.type === "integration") {
    return `${heading}${description}<div class="module-integration" role="presentation">Connect your integration here.</div>`;
  }

  return `${heading}${description}<form class="module-form"><input type="text" placeholder="Your name" /><input type="email" placeholder="you@example.com" /><button type="submit">Send</button></form>`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
