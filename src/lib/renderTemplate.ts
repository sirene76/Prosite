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
};

export function renderTemplate({ html, values, modules = [], theme }: RenderTemplateOptions) {
  if (!html) return "";

  // --- Inject absolute asset paths dynamically ---
  const templateMatch = html.match(/data-template-id="([\w-]+)"/);
  const templateId = templateMatch ? templateMatch[1] : detectTemplateFromHTML(html);

  let processedHtml = html;

  if (templateId) {
    processedHtml = processedHtml
      .replace(/src=["']\.\/assets\//g, `src="/templates/${templateId}/assets/`)
      .replace(/href=["']\.\/assets\//g, `href="/templates/${templateId}/assets/`)
      .replace(/href=["']styles\.css["']/g, `href="/templates/${templateId}/styles.css"`);
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

  const colorVars = buildThemeVariables(theme);
  if (!colorVars) {
    return rendered;
  }

  if (/<body[^>]*>/i.test(rendered)) {
    return rendered.replace(/<body([^>]*)>/i, `<body$1>${colorVars}`);
  }

  return `${colorVars}${rendered}`;
}

// Template ID detection fallback
function detectTemplateFromHTML(html: string): string | null {
  if (html.includes("Agency") || html.includes("agency")) return "agency-starter";
  if (html.includes("Restaurant") || html.includes("burger")) return "restaurant-classic";
  if (html.includes("Portfolio") || html.includes("portfolio")) return "portfolio-creative";
  if (html.includes("SaaS") || html.includes("saas")) return "saas-starter";
  return null;
}

function buildThemeVariables(theme: RenderTemplateOptions["theme"]) {
  if (!theme) {
    return "";
  }

  const tokens: string[] = [];

  if (theme.primary) {
    tokens.push(`--color-primary: ${theme.primary};`);
  }
  if (theme.secondary) {
    tokens.push(`--color-secondary: ${theme.secondary};`);
  }
  if (theme.background) {
    tokens.push(`--color-bg: ${theme.background};`);
  }
  if (theme.text) {
    tokens.push(`--color-text: ${theme.text};`);
  }

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
