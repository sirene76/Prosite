import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import { renderTemplate } from "@/lib/renderTemplate";
import { injectThemeTokens } from "@/lib/themes";
import { uploadDeployment } from "@/lib/storage";
import Website from "@/models/Website";
import { Template } from "@/models/template";

type ThemeInput = {
  colors?: Record<string, unknown> | null;
  fonts?: Record<string, unknown> | null;
  name?: string | null;
  label?: string | null;
} | null;

type WebsiteValues = Record<string, unknown> | null | undefined;

type TemplateModules = {
  id?: string;
  label?: string;
  description?: string;
}[];

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function normaliseValues(values: WebsiteValues): Record<string, string> {
  if (!values || typeof values !== "object") {
    return {};
  }

  const result = new Map<string, string>();

  const walk = (prefix: string, value: unknown) => {
    if (value == null) {
      return;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result.set(prefix, String(value));
      return;
    }

    if (Array.isArray(value)) {
      result.set(
        prefix,
        value
          .map((item) => (typeof item === "string" ? item : String(item)))
          .join("\n")
      );
      return;
    }

    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
        const key = prefix ? `${prefix}.${childKey}` : childKey;
        walk(key, childValue);
      });
      return;
    }
  };

  Object.entries(values).forEach(([key, value]) => {
    walk(key, value);
  });

  return Object.fromEntries(result.entries());
}

function ensureTemplateHtml(html?: string | null) {
  if (typeof html === "string" && html.trim().length > 0) {
    return html;
  }
  throw new Error("Template is missing HTML content");
}

function buildHtmlDocument({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "  <head>",
    "    <meta charset=\"utf-8\" />",
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
    `    <title>${title}</title>`,
    "    <link rel=\"stylesheet\" href=\"style.css\" />",
    "  </head>",
    "  <body>",
    body,
    "  </body>",
    "</html>",
    "",
  ].join("\n");
}

function resolveModules(modules: unknown): TemplateModules {
  if (!Array.isArray(modules)) {
    return [];
  }

  return modules.filter((module): module is TemplateModules[number] => {
    return module && typeof module === "object";
  });
}

function resolveTheme(theme: unknown): ThemeInput {
  if (!theme || typeof theme !== "object") {
    return null;
  }
  return theme as ThemeInput;
}

export async function deployWebsite(websiteId: string) {
  if (!websiteId || typeof websiteId !== "string") {
    throw new Error("Website ID is required");
  }

  await connectDB();

  const website = await Website.findById(websiteId).lean();
  if (!website) {
    throw new Error(`Website ${websiteId} not found`);
  }

  await Website.findByIdAndUpdate(websiteId, { status: "deploying" });

  const template = await Template.findById(website.templateId).lean();
  if (!template) {
    throw new Error(`Template ${website.templateId} not found`);
  }

  const templateHtml = ensureTemplateHtml(template.html);

  const modules = resolveModules(
    (template.meta && typeof template.meta === "object"
      ? (template.meta as Record<string, unknown>).modules
      : undefined) ?? (template as Record<string, unknown>).modules
  );

  const values = normaliseValues(website.values);

  const renderedHtml = renderTemplate({
    html: templateHtml,
    values,
    modules,
  });

  const theme = resolveTheme(website.theme);
  const css = typeof template.css === "string" ? template.css : "";
  const themedCSS = injectThemeTokens(css, theme ?? undefined);

  const robots = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml";

  const tmpDir = path.join(process.cwd(), "tmp", "deploy", websiteId);
  fs.mkdirSync(tmpDir, { recursive: true });

  const htmlOutput = buildHtmlDocument({
    title: website.name ?? "Prosite",
    body: renderedHtml,
  });

  fs.writeFileSync(path.join(tmpDir, "index.html"), htmlOutput, "utf8");
  fs.writeFileSync(path.join(tmpDir, "style.css"), themedCSS, "utf8");
  fs.writeFileSync(path.join(tmpDir, "robots.txt"), robots, "utf8");

  const templateId = typeof template._id === "string" ? template._id : template._id?.toString();
  if (templateId) {
    const templateAssetsDir = path.join(
      process.cwd(),
      "public",
      "templates",
      templateId
    );
    const assetsDir = path.join(templateAssetsDir, "assets");
    const jsFile = path.join(templateAssetsDir, "script.js");

    if (fs.existsSync(assetsDir)) {
      copyDir(assetsDir, path.join(tmpDir, "assets"));
    }

    if (fs.existsSync(jsFile)) {
      fs.copyFileSync(jsFile, path.join(tmpDir, "script.js"));
    }
  }

  const publicIndex = await uploadDeployment(tmpDir, websiteId);
  const provider =
    process.env.CF_ACCOUNT_ID && process.env.CF_R2_BUCKET ? "cloudflare" : "local";

  await Website.findByIdAndUpdate(websiteId, {
    status: "active",
    deployment: { url: publicIndex, provider },
  });

  console.log(`✅ Website ${websiteId} deployed → ${publicIndex}`);
  return publicIndex;
}
