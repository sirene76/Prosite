import { connectDB } from "@/lib/mongodb";
import { renderTemplate } from "@/lib/renderTemplate";
import Website from "@/models/Website";
import { Template } from "@/models/template";

export async function uploadToStorage(
  subdomain: string,
  files: Record<string, string>
) {
  console.log("Uploading", subdomain, Object.keys(files));
}

function toPlainObject<T extends Record<string, unknown>>(value: unknown): T {
  if (!value) {
    return {} as T;
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries()) as T;
  }

  if (typeof value === "object") {
    return value as T;
  }

  return {} as T;
}

function sanitizeSubdomain(value: string | undefined | null, fallback: string) {
  const clean = typeof value === "string" ? value : "";
  const normalized = clean
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length > 0) {
    return normalized;
  }

  const fallbackNormalized = fallback
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return fallbackNormalized.length > 0 ? fallbackNormalized : `site-${fallback}`;
}

function buildHtmlDocument(title: string, body: string) {
  const sanitizedTitle = title && title.trim().length > 0 ? title.trim() : "Prosite";
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${sanitizedTitle}</title>`,
    '    <link rel="stylesheet" href="style.css" />',
    "  </head>",
    "  <body>",
    body,
    '    <script src="script.js" defer></script>',
    "  </body>",
    "</html>",
    "",
  ].join("\n");
}

export async function triggerDeploy(websiteId: string) {
  if (!websiteId) {
    throw new Error("Website ID is required for deployment");
  }

  await connectDB();

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new Error(`Website ${websiteId} not found`);
  }

  const template = await Template.findById(website.templateId);
  if (!template) {
    throw new Error(`Template ${website.templateId} not found`);
  }

  const valuesSource = {
    ...toPlainObject<Record<string, unknown>>(website.content),
    ...toPlainObject<Record<string, unknown>>(website.values),
  };
  const rendered = renderTemplate({
    html: website.html || template.html || "",
    values: valuesSource as Record<string, string>,
  });

  const css = typeof website.css === "string" ? website.css : template.css || "";
  const js = typeof template.js === "string" ? template.js : "";

  const id = typeof website._id === "string" ? website._id : website._id?.toString();
  const fallback = id ?? "preview";
  const normalizedSubdomain = sanitizeSubdomain(website.subdomain, fallback);

  website.subdomain = normalizedSubdomain;

  const htmlDocument = buildHtmlDocument(website.name ?? "Prosite", rendered);

  const bundle = {
    "index.html": htmlDocument,
    "style.css": css,
    "script.js": js,
  } satisfies Record<string, string>;

  await uploadToStorage(normalizedSubdomain, bundle);

  const deploymentUrl = `https://${normalizedSubdomain}.prosite.com`;
  website.deployment = {
    url: deploymentUrl,
    lastDeployedAt: new Date(),
  };
  website.status = "active";

  await website.save();

  return deploymentUrl;
}
