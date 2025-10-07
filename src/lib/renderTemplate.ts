import type { TemplateModuleDefinition } from "@/lib/templates";

export type RenderTemplateOptions = {
  html: string;
  values: Record<string, string>;
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
  const templateMatch = html.match(/data-template-id="([\w-]+)"/);
  const templateId = templateMatch ? templateMatch[1] : detectTemplateFromHTML(html);

  let processedHtml = html;
  let inlineCss = css ?? "";

  if (templateId) {
    if (!inlineCss) {
      inlineCss = resolveTemplateCss(templateId);
    }

    processedHtml = processedHtml
      .replace(/<link[^>]*href=["'](?:\.\/)?style\.css["'][^>]*>/gi, "")
      .replace(/(src|href)=["'](?:\.\/)?assets\//gi, `$1="/templates/${templateId}/assets/`)
      .replace(/url\((['"]?)\.\/assets\//gi, `url($1/templates/${templateId}/assets/`);
  }

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

    processedHtml = applyThemeTokens({
      html: processedHtml,
      css: inlineCss,
      templateId,
      colors: colorTokens,
      fonts: themeTokens?.fonts,
    });
  }

  const moduleMap = new Map<string, string>();
  modules.forEach((module) => {
    const key = `modules.${module.id}`;
    moduleMap.set(key, renderModule(module));
  });

  const rendered = processedHtml.replace(/{{(.*?)}}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return "";
    if (moduleMap.has(key)) return moduleMap.get(key) ?? "";
    return values[key] ?? "";
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

const cssCache = new Map<string, string>();

function resolveTemplateCss(templateId: string) {
  if (cssCache.has(templateId)) {
    return cssCache.get(templateId) ?? "";
  }

  const css = readCssFromDisk(templateId);
  cssCache.set(templateId, css);
  return css;
}

function injectInlineCss(html: string, css: string, templateId: string | null) {
  if (!css.trim()) {
    return html;
  }

  const normalizedCss = templateId
    ? css.replace(/url\((['"]?)\.\/assets\//gi, `url($1/templates/${templateId}/assets/`)
    : css;
  const styleTag = `<style>${normalizedCss}</style>`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${styleTag}`);
  }

  return `${styleTag}${html}`;
}

type ThemeTokenMap = Record<string, string | undefined> | undefined;

export function applyThemeTokens({
  html,
  css,
  templateId,
  colors,
  fonts,
}: {
  html: string;
  css?: string;
  templateId?: string | null;
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

  return injectInlineCss(html, themedCss, templateId ?? null);
}

type DynamicRequire = ((path: string) => unknown) | null | undefined;
let cachedRequire: DynamicRequire;

function getDynamicRequire(): Exclude<DynamicRequire, undefined> {
  if (typeof cachedRequire !== "undefined") {
    return cachedRequire;
  }

  if (typeof window !== "undefined") {
    cachedRequire = null;
    return cachedRequire;
  }

  try {
    const fn = Function("return typeof require !== 'undefined' ? require : null");
    cachedRequire = fn();
  } catch {
    cachedRequire = null;
  }

  return cachedRequire;
}

function readCssFromDisk(templateId: string) {
  const dynamicRequire = getDynamicRequire();
  if (!dynamicRequire) {
    return "";
  }

  try {
    const fs = dynamicRequire("node:fs") as typeof import("node:fs");
    const path = dynamicRequire("node:path") as typeof import("node:path");
    const cssPath = path.join(process.cwd(), "templates", templateId, "style.css");
    if (fs.existsSync(cssPath)) {
      return fs.readFileSync(cssPath, "utf8");
    }
  } catch (error) {
    console.error(`Unable to inline CSS for template '${templateId}'`, error);
  }

  return "";
}

// Template ID detection fallback
function detectTemplateFromHTML(html: string): string | null {
  if (html.includes("Agency") || html.includes("agency")) return "agency-starter";
  if (html.includes("Restaurant") || html.includes("burger")) return "restaurant-classic";
  if (html.includes("Portfolio") || html.includes("portfolio")) return "portfolio-creative";
  if (html.includes("SaaS") || html.includes("saas")) return "saas-starter";
  return null;
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
