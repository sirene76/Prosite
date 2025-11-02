import process from "node:process";
import { pathToFileURL } from "node:url";

type PlainObject = Record<string, unknown>;

type TemplateMeta = {
  fields?: unknown;
  modules?: unknown;
  themes?: unknown;
};

type TemplateResponse = PlainObject & {
  _id?: string;
  id?: string;
  name?: string;
  meta?: TemplateMeta & PlainObject;
};

type WebsiteResponse = PlainObject & {
  _id?: string;
  id?: string;
  name?: string;
  templateId?: string | null;
  template?: string | { id?: string; _id?: string; templateId?: string } & PlainObject;
  content?: PlainObject | null;
  theme?: PlainObject | null;
  branding?: PlainObject | null;
};

function resolveBaseUrl(): string {
  const envCandidates = [
    process.env.DIAGNOSE_BASE_URL,
    process.env.BUILDER_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.BASE_URL,
  ];

  const fromEnv = envCandidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return (fromEnv ?? "http://localhost:3000").replace(/\/$/, "");
}

function listKeysWithTypes(data: PlainObject | undefined): Array<{ key: string; type: string }> {
  if (!data || typeof data !== "object") {
    return [];
  }

  return Object.entries(data).map(([key, value]) => ({
    key,
    type: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
  }));
}

function resolveTemplateId(website: WebsiteResponse): string | undefined {
  if (website.templateId && typeof website.templateId === "string" && website.templateId.trim()) {
    return website.templateId.trim();
  }

  const template = website.template;
  if (typeof template === "string" && template.trim()) {
    return template.trim();
  }

  if (template && typeof template === "object") {
    const candidates = [
      (template as { id?: string }).id,
      (template as { _id?: string })._id,
      (template as { templateId?: string }).templateId,
    ];
    const resolved = candidates.find((value) => typeof value === "string" && value.trim());
    if (resolved) {
      return resolved.trim();
    }
  }

  return undefined;
}

function extractContentKeys(content: WebsiteResponse["content"]): string[] {
  if (!content || typeof content !== "object") {
    return [];
  }
  return Object.keys(content).sort();
}

function extractThemeColorTokens(theme: WebsiteResponse["theme"]): string[] {
  if (!theme || typeof theme !== "object") {
    return [];
  }

  const themeObj = theme as PlainObject;
  const colorSources: unknown[] = [];

  if (typeof themeObj.colors === "object" && themeObj.colors) {
    colorSources.push(themeObj.colors);
  }
  if (typeof themeObj.tokens === "object" && themeObj.tokens) {
    colorSources.push(themeObj.tokens);
  }
  if (typeof themeObj.cssVariables === "object" && themeObj.cssVariables) {
    colorSources.push(themeObj.cssVariables);
  }

  if (colorSources.length === 0) {
    colorSources.push(themeObj);
  }

  const colorKeys = new Set<string>();

  for (const source of colorSources) {
    if (!source || typeof source !== "object") {
      continue;
    }
    for (const [key, value] of Object.entries(source as PlainObject)) {
      if (typeof value === "string" && key.trim()) {
        colorKeys.add(key.trim());
      }
    }
  }

  return Array.from(colorKeys).sort();
}

function describeMeta(meta: TemplateMeta | undefined): {
  hasFields: boolean;
  hasModules: boolean;
  hasThemes: boolean;
  fieldsCount: number;
  modulesCount: number;
  themesCount: number;
} {
  const describeList = (value: unknown): { has: boolean; count: number } => {
    if (!value) {
      return { has: false, count: 0 };
    }
    if (Array.isArray(value)) {
      return { has: value.length > 0, count: value.length };
    }
    if (typeof value === "object") {
      const keys = Object.keys(value as PlainObject);
      return { has: keys.length > 0, count: keys.length };
    }
    return { has: true, count: 1 };
  };

  const fieldsInfo = describeList(meta?.fields);
  const modulesInfo = describeList(meta?.modules);
  const themesInfo = describeList(meta?.themes);

  return {
    hasFields: fieldsInfo.has,
    hasModules: modulesInfo.has,
    hasThemes: themesInfo.has,
    fieldsCount: fieldsInfo.count,
    modulesCount: modulesInfo.count,
    themesCount: themesInfo.count,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText}) for ${url}`);
  }

  return (await response.json()) as T;
}

async function main() {
  const [, , websiteId] = process.argv;

  if (!websiteId || !websiteId.trim()) {
    console.error("❌ Please provide a website ID.\n👉 Usage: pnpm tsx scripts/diagnoseBuilderData.ts <websiteId>");
    process.exit(1);
  }

  const trimmedWebsiteId = websiteId.trim();
  const baseUrl = resolveBaseUrl();

  console.log("🔍 Diagnosing builder data...");
  console.log(`🔗 Base URL: ${baseUrl}`);

  const websiteUrl = `${baseUrl}/api/websites/${encodeURIComponent(trimmedWebsiteId)}`;
  console.log(`🌐 Fetching website → ${websiteUrl}`);

  let website: WebsiteResponse;
  try {
    website = await fetchJson<WebsiteResponse>(websiteUrl);
  } catch (error) {
    console.error(`❌ Failed to load website ${trimmedWebsiteId}: ${(error as Error).message}`);
    process.exit(1);
  }

  console.log("\n🗂️  Website response keys (type):");
  console.table(listKeysWithTypes(website));

  const hasTemplateId = typeof website.templateId === "string";
  const hasTemplate = Object.prototype.hasOwnProperty.call(website, "template");
  const hasTheme = Object.prototype.hasOwnProperty.call(website, "theme");
  const hasContent = Object.prototype.hasOwnProperty.call(website, "content");
  const hasBranding = Object.prototype.hasOwnProperty.call(website, "branding");

  console.log(`🧩 templateId present? ${hasTemplateId ? "✅ yes" : "⚠️  no"}`);
  console.log(`🧩 template present? ${hasTemplate ? "✅ yes" : "⚠️  no"}`);
  console.log(`🎨 theme present? ${hasTheme ? "✅ yes" : "⚠️  no"}`);
  console.log(`📝 content present? ${hasContent ? "✅ yes" : "⚠️  no"}`);
  console.log(`🏷️  branding present? ${hasBranding ? "✅ yes" : "⚠️  no"}`);

  const resolvedTemplateId = resolveTemplateId(website);
  if (resolvedTemplateId) {
    console.log(`🔐 Resolved templateId: ${resolvedTemplateId}`);
  } else {
    console.log("⚠️  Unable to resolve a templateId from website response.");
  }

  let template: TemplateResponse | undefined;
  if (resolvedTemplateId) {
    const templateUrl = `${baseUrl}/api/templates/${encodeURIComponent(resolvedTemplateId)}`;
    console.log(`\n🌐 Fetching template → ${templateUrl}`);
    try {
      template = await fetchJson<TemplateResponse>(templateUrl);
    } catch (error) {
      console.error(`❌ Failed to load template ${resolvedTemplateId}: ${(error as Error).message}`);
      process.exit(1);
    }

    console.log("\n🗂️  Template response keys (type):");
    console.table(listKeysWithTypes(template));

    const meta = template?.meta;
    const metaInfo = describeMeta(meta);
    console.log(`🧱 meta.fields present? ${metaInfo.hasFields ? "✅" : "⚠️"} (${metaInfo.fieldsCount} entries)`);
    console.log(`🧱 meta.modules present? ${metaInfo.hasModules ? "✅" : "⚠️"} (${metaInfo.modulesCount} entries)`);
    console.log(`🧱 meta.themes present? ${metaInfo.hasThemes ? "✅" : "⚠️"} (${metaInfo.themesCount} entries)`);
  }

  console.log("\n📊 Diagnostic summary");
  const summary: string[] = [];

  const websiteName = typeof website.name === "string" ? website.name : website._id ?? website.id ?? trimmedWebsiteId;
  summary.push(`✅ Website found: name=${websiteName}`);

  if (resolvedTemplateId) {
    summary.push(`✅ Template linked: templateId=${resolvedTemplateId}`);
  } else {
    summary.push("⚠️  Missing templateId field in website response.");
  }

  const contentKeys = extractContentKeys(website.content);
  if (contentKeys.length > 0) {
    summary.push(`✅ Content keys detected: ${contentKeys.join(", ")}`);
  } else if (hasContent) {
    summary.push("⚠️  Content object is empty – sections may render as placeholders.");
  } else {
    summary.push("⚠️  Website response missing content property.");
  }

  const themeColorTokens = extractThemeColorTokens(website.theme);
  if (themeColorTokens.length > 0) {
    summary.push(`✅ Theme tokens found: ${themeColorTokens.join(", ")}`);
  } else if (hasTheme) {
    summary.push("⚠️  Theme object lacks color tokens – preview may fallback to defaults.");
  } else {
    summary.push("⚠️  Website response missing theme property.");
  }

  if (template) {
    const metaInfo = describeMeta(template.meta);
    if (metaInfo.hasModules && metaInfo.hasFields) {
      summary.push(
        `✅ Template meta contains ${metaInfo.modulesCount} modules, ${metaInfo.fieldsCount} fields, ${metaInfo.themesCount} themes`
      );
    } else {
      if (!metaInfo.hasModules) {
        summary.push("⚠️  Template meta.modules is empty – builder modules cannot load.");
      }
      if (!metaInfo.hasFields) {
        summary.push("⚠️  Template meta.fields is empty – placeholders won’t render.");
      }
      if (!metaInfo.hasThemes) {
        summary.push("⚠️  Template meta.themes is empty – theme switching disabled.");
      }
    }
  } else if (resolvedTemplateId) {
    summary.push("⚠️  Template fetch failed – see errors above.");
  }

  if (hasBranding && website.branding && typeof website.branding === "object" && Object.keys(website.branding).length > 0) {
    summary.push("✅ Branding data detected.");
  } else {
    summary.push("⚠️  Branding data missing or empty.");
  }

  const hasCriticalWarning = summary.some((line) => line.startsWith("⚠️"));
  summary.forEach((line) => console.log(line));

  if (!hasCriticalWarning) {
    console.log("→ Builder should populate inspector + preview normally.");
  } else {
    console.log("→ Review warnings above to resolve builder placeholders.");
  }
}

const isDirectExecution = typeof process.argv[1] === "string" && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}