import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import { renderTemplate } from "@/lib/renderTemplate";
import Website from "@/models/Website";
import { Template } from "@/models/template";

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

function toPlainObject<T extends Record<string, unknown>>(value: unknown): T {
  if (!value) return {} as T;
  if (value instanceof Map) return Object.fromEntries(value.entries()) as T;
  if (typeof value === "object") return value as T;
  return {} as T;
}

function sanitizeSubdomain(value: string | undefined | null, fallback: string) {
  const clean = typeof value === "string" ? value : "";
  const normalized = clean
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : `site-${fallback}`;
}

function buildHtmlDocument(title: string, body: string) {
  const safeTitle = title?.trim() || "Prosite";
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    ${body}
    <script src="script.js" defer></script>
  </body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*                             Local File Uploader                            */
/* -------------------------------------------------------------------------- */

export async function uploadToStorage(
  subdomain: string,
  files: Record<string, string>
) {
  const baseDir = path.join(process.cwd(), "public", "deployments", subdomain);
  await fs.promises.mkdir(baseDir, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(baseDir, filename);
    await fs.promises.writeFile(filePath, content, "utf8");
  }

  console.log(`✅ Deployed locally → /public/deployments/${subdomain}`);
}

/* -------------------------------------------------------------------------- */
/*                               Deploy Function                              */
/* -------------------------------------------------------------------------- */

export async function triggerDeploy(websiteId: string) {
  if (!websiteId) throw new Error("Website ID is required for deployment");

  await connectDB();

  const website = await Website.findById(websiteId);
  if (!website) throw new Error(`Website ${websiteId} not found`);

  const template = await Template.findById(website.templateId);
  if (!template) throw new Error(`Template ${website.templateId} not found`);

  // ------------------ Prepare render data ------------------
  const contentValues = toPlainObject<Record<string, unknown>>(website.content);
  const customValues = toPlainObject<Record<string, unknown>>(website.values);

  const valuesSource = {
    ...contentValues,
    ...customValues,
  };

  // ------------------ Render HTML ------------------
  const renderedHtml = renderTemplate({
    html: website.html || template.html || "",
    values: valuesSource,
  });

  // ------------------ Build themed CSS ------------------
  const themeVars =
    website.theme?.colors && typeof website.theme.colors === "object"
      ? Object.entries(website.theme.colors)
          .map(([key, val]) => `${key}: ${val};`)
          .join(" ")
      : "";

  const themeCss = themeVars ? `:root { ${themeVars} }\n\n` : "";
  const baseCss =
    typeof website.css === "string" && website.css.trim().length > 0
      ? website.css
      : template.css || "";

  const finalCss = themeCss + baseCss;
  const js = typeof template.js === "string" ? template.js : "";

  // ------------------ Generate files ------------------
  const htmlDocument = buildHtmlDocument(website.name ?? "Prosite", renderedHtml);

  const id =
    typeof website._id === "string" ? website._id : website._id.toString();
  const normalizedSubdomain = sanitizeSubdomain(website.subdomain, id);
  website.subdomain = normalizedSubdomain;

  const bundle = {
    "index.html": htmlDocument,
    "style.css": finalCss,
    "script.js": js,
  };

  await uploadToStorage(normalizedSubdomain, bundle);

  // ------------------ Save deployment info ------------------
  const deploymentUrl = `/deployments/${normalizedSubdomain}/index.html`;
  website.deployment = {
    url: deploymentUrl,
    lastDeployedAt: new Date(),
  };
  website.status = "active";

  await website.save();

  console.log(`✅ Local deployment ready at: ${deploymentUrl}`);
  return deploymentUrl;
}
