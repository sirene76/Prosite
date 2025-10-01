import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const templatesDir = path.join(process.cwd(), "templates");

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  path: string;
  sections: string[];
  colors: string[];
  fonts: string[];
};

function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function readMetaFileSync(metaPath: string) {
  const raw = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(raw) as Partial<TemplateDefinition & { path?: string }>;
}

function sanitizeTemplateId(templateId: string) {
  const normalized = path.normalize(templateId);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid template identifier");
  }
  return normalized;
}

async function readMetaFile(metaPath: string) {
  const raw = await fsPromises.readFile(metaPath, "utf-8");
  return JSON.parse(raw) as Partial<TemplateDefinition & { path?: string }>;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    const stat = await fsPromises.stat(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`Expected directory at ${dirPath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Template directory not found: ${dirPath}`);
    }
    throw error;
  }
}

export function loadTemplates(): TemplateDefinition[] {
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  const templates: TemplateDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    const folderPath = path.join(templatesDir, folderName);
    const metaPath = path.join(folderPath, "meta.json");

    try {
      const meta = readMetaFileSync(metaPath);
      const id = typeof meta.id === "string" && meta.id.length > 0 ? meta.id : folderName;
      const name = typeof meta.name === "string" && meta.name.length > 0 ? meta.name : toTitleCase(id);

      templates.push({
        id,
        name,
        description: typeof meta.description === "string" ? meta.description : "",
        previewImage: typeof meta.previewImage === "string" ? meta.previewImage : "",
        path: `/templates/${folderName}`,
        sections: Array.isArray(meta.sections) ? meta.sections.map(String) : [],
        colors: Array.isArray(meta.colors) ? meta.colors.map(String) : [],
        fonts: Array.isArray(meta.fonts) ? meta.fonts.map(String) : [],
      });
    } catch (error) {
      console.warn(`Failed to read template metadata for ${folderName}:`, error);
    }
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveTemplateDirectory(templateId: string) {
  const safeId = sanitizeTemplateId(templateId);
  const directories = await fsPromises.readdir(templatesDir, { withFileTypes: true });

  for (const entry of directories) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    const folderPath = path.join(templatesDir, folderName);
    const metaPath = path.join(folderPath, "meta.json");

    try {
      const meta = await readMetaFile(metaPath);
      if (meta.id === safeId || folderName === safeId) {
        await ensureDirectoryExists(folderPath);
        return { folderPath, folderName };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Template not found: ${templateId}`);
}

export async function getTemplateHtml(templateId: string): Promise<string> {
  const { folderPath } = await resolveTemplateDirectory(templateId);
  const filePath = path.join(folderPath, "index.html");

  try {
    return await fsPromises.readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`HTML file not found for template: ${templateId}`);
    }
    throw error;
  }
}

export async function getTemplateCss(templateId: string): Promise<string> {
  const { folderPath } = await resolveTemplateDirectory(templateId);
  const filePath = path.join(folderPath, "style.css");

  try {
    return await fsPromises.readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`CSS file not found for template: ${templateId}`);
    }
    throw error;
  }
}

export async function loadTemplateAssets(templateId: string): Promise<{ html: string; css: string }> {
  const [html, css] = await Promise.all([getTemplateHtml(templateId), getTemplateCss(templateId)]);
  return { html, css };
}
