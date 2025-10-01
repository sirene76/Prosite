import fs from "fs/promises";
import path from "path";

import { templates, type TemplateDefinition } from "./templateDefinitions";

const templatesDir = path.join(process.cwd(), "templates");

function sanitizeTemplateId(templateId: string) {
  const normalized = path.normalize(templateId);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid template identifier");
  }
  return normalized;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`Expected directory at ${dirPath}`);
    }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Template directory not found: ${dirPath}`);
    }
    throw error;
  }
}

export function getTemplatesMetadata(): TemplateDefinition[] {
  return templates;
}

export async function getTemplateList(): Promise<string[]> {
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

export async function getTemplateHtml(templateId: string): Promise<string> {
  const safeId = sanitizeTemplateId(templateId);
  const templatePath = path.join(templatesDir, safeId);
  await ensureDirectoryExists(templatePath);

  const templateMeta = templates.find((template) => template.id === safeId);
  const htmlFileName = templateMeta?.htmlFile ?? "index.html";
  const filePath = path.join(templatePath, htmlFileName);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`HTML file not found for template: ${templateId}`);
    }
    throw error;
  }
}

export async function getTemplateCss(templateId: string): Promise<string> {
  const safeId = sanitizeTemplateId(templateId);
  const templatePath = path.join(templatesDir, safeId);
  await ensureDirectoryExists(templatePath);

  const templateMeta = templates.find((template) => template.id === safeId);
  const cssFileName = templateMeta?.cssFile ?? "style.css";
  const filePath = path.join(templatePath, cssFileName);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`CSS file not found for template: ${templateId}`);
    }
    throw error;
  }
}

export async function loadTemplateAssets(templateId: string): Promise<{ html: string; css: string }> {
  const [html, css] = await Promise.all([
    getTemplateHtml(templateId),
    getTemplateCss(templateId)
  ]);

  return { html, css };
}
