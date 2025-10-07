import { promises as fsPromises, type Dirent } from "fs";
import path from "path";

import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

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

export type TemplateBuilderCustomPanel = {
  id: string;
  label: string;
  type: string;
  limit?: number;
};

export type TemplateBuilderConfig = {
  showTheme?: boolean;
  showPages?: boolean;
  layout?: string;
  accentColor?: string;
  customPanels?: TemplateBuilderCustomPanel[];
};

export type TemplateDefinition = {
  id: string;
  slug?: string;
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
  html?: string;
  css?: string;
  meta?: Record<string, unknown>;
  isDynamic?: boolean;
  builder?: TemplateBuilderConfig;
};

export type TemplateRegistryEntry = TemplateDefinition & {
  directory: string;
  assetsDirectory: string | null;
};

export type DynamicTemplateDefinition = TemplateDefinition & {
  html: string;
  css: string;
  meta: Record<string, unknown>;
  isDynamic: true;
};

const TemplateFieldConfigSchema = z
  .object({
    type: z.string().optional(),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    default: z.string().optional(),
  })
  .passthrough();

const TemplateSectionSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().optional(),
    description: z.string().optional(),
    fields: z.array(TemplateFieldConfigSchema).optional(),
  })
  .passthrough();

const TemplateBuilderPanelSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  limit: z.number().int().positive().optional(),
});

const TemplateBuilderSchema = z
  .object({
    showTheme: z.boolean().optional(),
    showPages: z.boolean().optional(),
    layout: z.string().optional(),
    accentColor: z.string().optional(),
    customPanels: z.array(TemplateBuilderPanelSchema).optional(),
  })
  .partial()
  .passthrough();

const TemplateColorsSchema = z.union([
  z.record(z.string()),
  z.array(z.union([z.string(), z.record(z.any())])),
]);

const TemplateFontsSchema = z.union([
  z.record(z.union([z.string(), z.record(z.any())])),
  z.array(z.union([z.string(), z.record(z.any())])),
]);

export const MetaJsonSchema = z
  .object({
    id: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    previewImage: z.string().optional(),
    preview: z.string().optional(),
    previewVideo: z.string().optional(),
    video: z.string().optional(),
    previewImages: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    sections: z.array(z.union([z.string(), TemplateSectionSchema])).optional(),
    fields: z.record(TemplateFieldConfigSchema).optional(),
    colors: TemplateColorsSchema.optional(),
    fonts: TemplateFontsSchema.optional(),
    modules: z.array(z.record(z.any())).optional(),
    builder: TemplateBuilderSchema.optional(),
  })
  .passthrough();

type RawTemplateMeta = z.infer<typeof MetaJsonSchema>;

export async function getTemplates(): Promise<TemplateDefinition[]> {
  const entries = await readTemplateRegistry();
  const databaseTemplates = await readDatabaseTemplates();

  return [...databaseTemplates, ...entries.map(stripFilesystemFields)];
}

async function readDatabaseTemplates(): Promise<TemplateDefinition[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    await connectDB();
  } catch (error) {
    console.warn("Skipping database templates: failed to connect to MongoDB", error);
    return [];
  }

  try {
    const dbTemplates = await Template.find().lean<DatabaseTemplateDocument[]>();

    return dbTemplates
      .map((template) => buildDatabaseTemplateDefinition(template))
      .filter((template): template is DynamicTemplateDefinition => Boolean(template));
  } catch (error) {
    console.error("Failed to load templates from MongoDB", error);
    return [];
  }
}

async function loadDatabaseTemplate(templateId: string): Promise<DynamicTemplateDefinition | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    await connectDB();
  } catch (error) {
    console.warn(`Skipping database template lookup for ${templateId}: failed to connect to MongoDB`, error);
    return null;
  }

  try {
    const template = await Template.findOne({ slug: templateId }).lean<DatabaseTemplateDocument | null>();
    if (!template) {
      return null;
    }

    return buildDatabaseTemplateDefinition(template);
  } catch (error) {
    console.error(`Failed to load template ${templateId} from MongoDB`, error);
    return null;
  }
}

type DatabaseTemplateDocument = {
  slug?: string;
  name?: string;
  category?: string;
  description?: string;
  previewImage?: string;
  html?: string;
  css?: string;
  meta?: unknown;
};

function buildDatabaseTemplateDefinition(template: DatabaseTemplateDocument): DynamicTemplateDefinition | null {
  const slug = readOptionalString(template.slug);
  if (!slug) {
    return null;
  }

  const meta = parseTemplateMeta(template.meta);

  const metaPreviewImages = normaliseStringArray(meta.previewImages);
  const metaFeatures = normaliseStringArray(meta.features);
  const metaPreviewImage = readOptionalString(meta.previewImage ?? meta.preview);
  const previewImage = readOptionalString(template.previewImage) ?? metaPreviewImage ?? metaPreviewImages[0] ?? "";
  const previewVideo = readOptionalString(meta.previewVideo ?? meta.video);
  const name = readOptionalString(template.name) ?? readOptionalString(meta.name) ?? toTitleCase(slug);
  const category = readOptionalString(template.category) ?? readOptionalString(meta.category);
  const description =
    typeof template.description === "string"
      ? template.description
      : readOptionalString(meta.description) ?? "";

  const sectionsFromFields = normaliseFieldMap(meta.fields);
  const sections = sectionsFromFields.length ? sectionsFromFields : normaliseSections(meta.sections);
  const colors = normaliseColors(meta.colors);
  const fonts = normaliseFonts(meta.fonts);
  const modules = normaliseModules(meta.modules);
  const builder = normaliseBuilder(meta.builder);

  return {
    id: slug,
    slug,
    name,
    category: category ?? undefined,
    description,
    previewImage,
    previewVideo: previewVideo ?? undefined,
    previewImages: metaPreviewImages.length ? metaPreviewImages : undefined,
    features: metaFeatures.length ? metaFeatures : undefined,
    path: `/templates/${slug}`,
    sections,
    colors,
    fonts,
    modules,
    builder,
    html: typeof template.html === "string" ? template.html : "",
    css: typeof template.css === "string" ? template.css : "",
    meta: meta as Record<string, unknown>,
    isDynamic: true,
  } satisfies DynamicTemplateDefinition;
}

function parseTemplateMeta(meta: unknown): RawTemplateMeta {
  if (!meta) {
    return {} as RawTemplateMeta;
  }

  let candidate: unknown = meta;

  if (typeof meta === "string") {
    const trimmed = meta.trim();
    if (!trimmed) {
      return {} as RawTemplateMeta;
    }
    try {
      candidate = JSON.parse(trimmed) as unknown;
    } catch (error) {
      console.warn("Failed to parse template meta JSON", error);
      return {} as RawTemplateMeta;
    }
  }

  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return {} as RawTemplateMeta;
  }

  const result = MetaJsonSchema.safeParse(candidate);
  if (!result.success) {
    console.warn("Template meta.json validation failed", result.error.format());
    return {} as RawTemplateMeta;
  }

  return result.data;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normaliseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return (value as unknown[])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => Boolean(item));
}

export async function getTemplateById(
  templateId: string
): Promise<TemplateRegistryEntry | DynamicTemplateDefinition | null> {
  const safeId = templateId.trim();
  if (!safeId) {
    return null;
  }

  const dynamicTemplate = await loadDatabaseTemplate(safeId);
  if (dynamicTemplate) {
    return dynamicTemplate;
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

  if (isDynamicTemplate(template)) {
    return {
      html: template.html ?? "",
      css: template.css ?? "",
    };
  }

  const htmlPath = path.join(template.directory, "index.html");
  const cssPath = path.join(template.directory, "style.css");

  const [html, css] = await Promise.all([
    readTextFile(htmlPath),
    readTextFile(cssPath).catch(() => ""),
  ]);
  return { html, css };
}

export async function getTemplateAssetFiles(
  templateId: string
): Promise<Array<{ relativePath: string; content: Buffer }>> {
  const template = await getTemplateById(templateId);
  if (!template) {
    return [];
  }

  if (isDynamicTemplate(template) || !template.assetsDirectory) {
    return [];
  }

  return readDirectoryRecursive(template.assetsDirectory, template.assetsDirectory).catch(() => []);
}

async function readTemplateRegistry(): Promise<TemplateRegistryEntry[]> {
  let folders: Dirent[];
  try {
    folders = await fsPromises.readdir(templatesRoot, { withFileTypes: true });
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
      const raw = await fsPromises.readFile(metaPath, "utf-8");
      const meta = parseTemplateMeta(raw);
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
  const builder = normaliseBuilder(meta.builder);

  const assetsDirectory = await normaliseAssetsDirectory(folderPath);

  return {
    id,
    slug: id,
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
    builder,
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

function normaliseBuilder(raw: RawTemplateMeta["builder"]): TemplateBuilderConfig | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const showTheme = typeof raw.showTheme === "boolean" ? raw.showTheme : undefined;
  const showPages = typeof raw.showPages === "boolean" ? raw.showPages : undefined;
  const layout = typeof raw.layout === "string" && raw.layout.trim() ? raw.layout.trim() : undefined;
  const accentColor = typeof raw.accentColor === "string" && raw.accentColor.trim() ? raw.accentColor.trim() : undefined;

  const customPanels = Array.isArray(raw.customPanels)
    ? raw.customPanels
        .map((panel) => {
          if (!panel || typeof panel !== "object") {
            return null;
          }

          const id = typeof panel.id === "string" && panel.id.trim() ? panel.id.trim() : undefined;
          const label = typeof panel.label === "string" && panel.label.trim() ? panel.label.trim() : undefined;
          const type = typeof panel.type === "string" && panel.type.trim() ? panel.type.trim() : undefined;
          if (!id || !label || !type) {
            return null;
          }

          const rawLimit = (panel as { limit?: unknown }).limit;
          const limit =
            typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit > 0
              ? Math.floor(rawLimit)
              : undefined;

          return { id, label, type, limit } satisfies TemplateBuilderCustomPanel;
        })
        .filter((panel): panel is TemplateBuilderCustomPanel => Boolean(panel))
    : undefined;

  const builder: TemplateBuilderConfig = {
    showTheme,
    showPages,
    layout,
    accentColor,
    customPanels,
  };

  const hasContent =
    typeof builder.showTheme === "boolean" ||
    typeof builder.showPages === "boolean" ||
    typeof builder.layout === "string" ||
    typeof builder.accentColor === "string" ||
    (Array.isArray(builder.customPanels) && builder.customPanels.length > 0);

  return hasContent ? builder : undefined;
}

async function normaliseAssetsDirectory(folderPath: string): Promise<string | null> {
  const assetsPath = path.join(folderPath, "assets");
  try {
    const stat = await fsPromises.stat(assetsPath);
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

function isDynamicTemplate(
  template: TemplateDefinition | TemplateRegistryEntry | DynamicTemplateDefinition
): template is DynamicTemplateDefinition {
  return Boolean(template.isDynamic);
}

function stripFilesystemFields(entry: TemplateRegistryEntry): TemplateDefinition {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { directory, assetsDirectory, ...definition } = entry;
  return { ...definition, isDynamic: false };
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fsPromises.readFile(filePath, "utf-8");
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
  const entries = await fsPromises.readdir(directory, { withFileTypes: true });
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
    const content = await fsPromises.readFile(entryPath);
    files.push({ relativePath, content });
  }

  return files;
}
