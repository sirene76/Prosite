import { promises as fs } from "fs";
import type { Dirent } from "fs";
import path from "path";

const templatesRoot = path.join(process.cwd(), "templates");

export type TemplateSummary = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
};

export const templates: TemplateSummary[] = [
  {
    id: "portfolio-creative",
    name: "Portfolio Creative",
    description: "Modern portfolio layout with clean typography.",
    thumbnail: "/templates/portfolio-creative/preview.png",
  },
  {
    id: "agency-starter",
    name: "Agency Starter",
    description: "Professional agency design with services, projects, testimonials, and FAQ.",
    thumbnail: "/templates/agency-starter/preview.png",
  },
  {
    id: "restaurant-classic",
    name: "Restaurant Classic",
    description: "Bold restaurant theme with menu grid and food imagery.",
    thumbnail: "/templates/restaurant-classic/preview.png",
  },
];

export type TemplateFieldType = "text" | "textarea" | "image" | "color";

export type TemplateFieldDefinition = {
  id: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  default?: string;
  description?: string;
};

export type TemplateSectionDefinition = {
  id: string;
  label: string;
  description?: string;
  fields: TemplateFieldDefinition[];
};

export type TemplateColorDefinition = {
  id: string;
  label: string;
  default?: string;
};

export type TemplateModuleType = "form" | "iframe" | "integration";

export type TemplateModuleDefinition = {
  id: string;
  label: string;
  type: TemplateModuleType;
  description?: string;
  url?: string;
  height?: number;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  category?: string;
  description: string;
  previewImage: string;
  previewVideo?: string;
  previewImages?: string[];
  features?: string[];
  path: string;
  sections: TemplateSectionDefinition[];
  colors: TemplateColorDefinition[];
  fonts: string[];
  modules: TemplateModuleDefinition[];
};

export type TemplateRegistryEntry = TemplateDefinition & {
  directory: string;
  assetsDirectory: string | null;
};

type RawTemplateMeta = {
  id?: unknown;
  name?: unknown;
  category?: unknown;
  description?: unknown;
  previewImage?: unknown;
  preview?: unknown;
  video?: unknown;
  previewImages?: unknown;
  features?: unknown;
  sections?: unknown;
  fields?: unknown;
  colors?: unknown;
  fonts?: unknown;
  modules?: unknown;
};

export async function getTemplates(): Promise<TemplateDefinition[]> {
  const entries = await readTemplateRegistry();
  return entries.map(stripFilesystemFields);
}

export async function getTemplateById(templateId: string): Promise<TemplateRegistryEntry | null> {
  const safeId = templateId.trim();
  if (!safeId) {
    return null;
  }

  const entries = await readTemplateRegistry();
  const match = entries.find((entry) => entry.id === safeId || path.basename(entry.path) === safeId);
  return match ?? null;
}

export async function getTemplateAssets(templateId: string): Promise<{ html: string; css: string }> {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const htmlPath = path.join(template.directory, "index.html");
  const cssPath = path.join(template.directory, "style.css");

  const [html, css] = await Promise.all([readTextFile(htmlPath), readTextFile(cssPath)]);
  return { html, css };
}

export async function getTemplateAssetFiles(
  templateId: string
): Promise<Array<{ relativePath: string; content: Buffer }>> {
  const template = await getTemplateById(templateId);
  if (!template || !template.assetsDirectory) {
    return [];
  }

  return readDirectoryRecursive(template.assetsDirectory, template.assetsDirectory).catch(() => []);
}

async function readTemplateRegistry(): Promise<TemplateRegistryEntry[]> {
  let folders: Dirent[];
  try {
    folders = await fs.readdir(templatesRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const templates: TemplateRegistryEntry[] = [];

  for (const entry of folders) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    const folderPath = path.join(templatesRoot, folderName);
    const metaPath = path.join(folderPath, "meta.json");

    try {
      const raw = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(raw) as RawTemplateMeta;
      const template = await buildTemplateDefinition(meta, folderName, folderPath);
      templates.push(template);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue;
      }
      console.warn(`Failed to load template metadata for ${folderName}:`, error);
    }
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

async function buildTemplateDefinition(
  meta: RawTemplateMeta,
  folderName: string,
  folderPath: string
): Promise<TemplateRegistryEntry> {
  const id = toId(typeof meta.id === "string" ? meta.id : folderName);
  const name = typeof meta.name === "string" && meta.name.trim() ? meta.name.trim() : toTitleCase(id);
  const description = typeof meta.description === "string" ? meta.description : "";
  const previewImage =
    typeof meta.previewImage === "string"
      ? meta.previewImage
      : typeof meta.preview === "string"
        ? meta.preview
        : "";
  const previewVideo = typeof meta.video === "string" ? meta.video : undefined;
  const category =
    typeof meta.category === "string" && meta.category.trim() ? meta.category.trim() : undefined;
  const previewImagesRaw = Array.isArray(meta.previewImages)
    ? (meta.previewImages as unknown[])
        .map((value) => (typeof value === "string" && value.trim() ? value.trim() : null))
        .filter((value): value is string => Boolean(value))
    : [];
  const previewImages = previewImagesRaw.length ? previewImagesRaw : undefined;
  const featuresRaw = Array.isArray(meta.features)
    ? (meta.features as unknown[])
        .map((value) => (typeof value === "string" && value.trim() ? value.trim() : null))
        .filter((value): value is string => Boolean(value))
    : [];
  const features = featuresRaw.length ? featuresRaw : undefined;

  const sectionsFromFields = normaliseFieldMap(meta.fields);
  const sections = sectionsFromFields.length ? sectionsFromFields : normaliseSections(meta.sections);
  const colors = normaliseColors(meta.colors);
  const fonts = normaliseFonts(meta.fonts);
  const modules = normaliseModules(meta.modules);

  const assetsDirectory = await normaliseAssetsDirectory(folderPath);

  return {
    id,
    name,
    category,
    description,
    previewImage,
    previewVideo,
    previewImages,
    features,
    path: `/templates/${folderName}`,
    sections,
    colors,
    fonts,
    modules,
    directory: folderPath,
    assetsDirectory,
  };
}

function toId(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSlug(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normaliseFieldMap(raw: unknown): TemplateSectionDefinition[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  const sections = new Map<string, { definition: TemplateSectionDefinition; order: number }>();
  let sectionOrder = 0;

  for (const [key, value] of entries) {
    if (typeof key !== "string") {
      continue;
    }

    const trimmedKey = key.trim();
    if (!trimmedKey) {
      continue;
    }

    if (!value || typeof value !== "object") {
      continue;
    }

    const parts = trimmedKey.split(".");
    const hasSection = parts.length > 1;
    const rawSection = hasSection ? parts[0] : "general";
    const sectionId = toSlug(rawSection, rawSection || "section");

    if (!sections.has(sectionId)) {
      const label = hasSection ? toTitleCase(rawSection) : "General";
      sections.set(sectionId, {
        definition: { id: sectionId, label, fields: [] },
        order: sectionOrder++,
      });
    }

    const section = sections.get(sectionId);
    if (!section) {
      continue;
    }

    const config = value as Record<string, unknown>;
    const fieldLabelPart = hasSection ? parts.slice(1).join(".") : parts[0];
    const label =
      typeof config.label === "string" && config.label.trim()
        ? config.label.trim()
        : toTitleCase(fieldLabelPart);
    const placeholder = typeof config.placeholder === "string" ? config.placeholder : undefined;
    const description = typeof config.description === "string" ? config.description : undefined;
    const defaultValue = typeof config.default === "string" ? config.default : undefined;

    section.definition.fields.push({
      id: trimmedKey,
      label,
      type: normaliseFieldType(config.type),
      placeholder,
      description,
      default: defaultValue,
    });
  }

  return Array.from(sections.values())
    .sort((a, b) => a.order - b.order)
    .map(({ definition }) => ({
      ...definition,
      fields: definition.fields.filter(Boolean),
    }))
    .filter((section) => section.fields.length > 0);
}

function normaliseSections(raw: unknown): TemplateSectionDefinition[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  if (raw.every((section) => typeof section === "string")) {
    return (raw as string[]).map((label) => {
      const id = toSlug(label, label);
      return { id, label: toTitleCase(label), fields: [] };
    });
  }

  return (raw as Array<Record<string, unknown>>)
    .map((section, index) => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const idValue = typeof section.id === "string" ? section.id : `section-${index + 1}`;
      const id = toSlug(idValue, `section-${index + 1}`);
      const label = typeof section.label === "string" && section.label.trim() ? section.label.trim() : toTitleCase(id);
      const description = typeof section.description === "string" ? section.description : undefined;
      const fields = normaliseFields(section.fields, id);

      return {
        id,
        label,
        description,
        fields,
      } satisfies TemplateSectionDefinition;
    })
    .filter((section): section is TemplateSectionDefinition => Boolean(section));
}

function normaliseFields(raw: unknown, sectionId: string): TemplateFieldDefinition[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return (raw as Array<Record<string, unknown>>)
    .map((field, index) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      const id = typeof field.id === "string" && field.id.trim() ? field.id.trim() : `${sectionId}.field${index + 1}`;
      const label =
        typeof field.label === "string" && field.label.trim()
          ? field.label.trim()
          : toTitleCase(id.split(".").pop() ?? id);
      const placeholder = typeof field.placeholder === "string" ? field.placeholder : undefined;
      const description = typeof field.description === "string" ? field.description : undefined;
      const defaultValue = typeof field.default === "string" ? field.default : undefined;
      const type = normaliseFieldType(field.type);

      return {
        id,
        label,
        type,
        placeholder,
        description,
        default: defaultValue,
      } satisfies TemplateFieldDefinition;
    })
    .filter((field): field is TemplateFieldDefinition => Boolean(field));
}

function normaliseFieldType(value: unknown): TemplateFieldType {
  if (value === "textarea" || value === "image" || value === "color") {
    return value;
  }
  return "text";
}

function normaliseColors(raw: unknown): TemplateColorDefinition[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return (raw as Array<string | Record<string, unknown>>)
      .map((entry, index) => {
        if (typeof entry === "string") {
          const id = entry.trim();
          if (!id) {
            return null;
          }
          return { id, label: toTitleCase(id) } satisfies TemplateColorDefinition;
        }

        if (!entry || typeof entry !== "object") {
          return null;
        }

        const idRaw = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `color-${index + 1}`;
        const id = toSlug(idRaw, `color-${index + 1}`);
        const label = typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : toTitleCase(id);
        const defaultValue = typeof entry.default === "string" ? entry.default : undefined;

        return { id, label, default: defaultValue } satisfies TemplateColorDefinition;
      })
      .filter((color): color is TemplateColorDefinition => Boolean(color));
  }

  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([key, value]) => {
        const idRaw = key.trim();
        if (!idRaw) {
          return null;
        }

        const id = toSlug(idRaw, idRaw);
        const defaultValue = typeof value === "string" ? value : undefined;
        return { id, label: toTitleCase(id), default: defaultValue } satisfies TemplateColorDefinition;
      })
      .filter((color): color is TemplateColorDefinition => Boolean(color));
  }

  return [];
}

function normaliseFonts(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((entry) => (typeof entry === "string" ? entry.trim() : String(entry)))
      .map((value) => value.trim())
      .filter((value) => Boolean(value));
  }

  if (raw && typeof raw === "object") {
    return Object.keys(raw as Record<string, unknown>)
      .map((key) => key.trim())
      .filter((key) => Boolean(key));
  }

  return [];
}

function normaliseModules(raw: unknown): TemplateModuleDefinition[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return (raw as Array<Record<string, unknown>>)
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const idRaw = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `module-${index + 1}`;
      const id = toSlug(idRaw, `module-${index + 1}`);
      const label = typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : toTitleCase(id);
      const type = normaliseModuleType(entry.type);
      const description = typeof entry.description === "string" ? entry.description : undefined;
      const url =
        typeof entry.url === "string"
          ? entry.url
          : typeof (entry as { src?: unknown }).src === "string"
            ? ((entry as { src: string }).src)
            : undefined;
      const height = typeof entry.height === "number" ? entry.height : undefined;

      return {
        id,
        label,
        type,
        description,
        url,
        height,
      } satisfies TemplateModuleDefinition;
    })
    .filter((module): module is TemplateModuleDefinition => Boolean(module));
}

function normaliseModuleType(value: unknown): TemplateModuleType {
  if (value === "iframe" || value === "integration") {
    return value;
  }
  return "form";
}

async function normaliseAssetsDirectory(folderPath: string): Promise<string | null> {
  const assetsPath = path.join(folderPath, "assets");
  try {
    const stat = await fs.stat(assetsPath);
    if (stat.isDirectory()) {
      return assetsPath;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`Failed to read assets directory for ${folderPath}:`, error);
    }
  }
  return null;
}

function stripFilesystemFields(entry: TemplateRegistryEntry): TemplateDefinition {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { directory, assetsDirectory, ...definition } = entry;
  return definition;
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Missing file: ${filePath}`);
    }
    throw error;
  }
}

async function readDirectoryRecursive(
  directory: string,
  base: string
): Promise<Array<{ relativePath: string; content: Buffer }>> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: Array<{ relativePath: string; content: Buffer }> = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await readDirectoryRecursive(entryPath, base);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path.relative(base, entryPath).replace(/\\/g, "/");
    const content = await fs.readFile(entryPath);
    files.push({ relativePath, content });
  }

  return files;
}
