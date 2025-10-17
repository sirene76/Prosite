import type { TemplateModuleDefinition } from "@/lib/templates";
import type {
  TemplateContentField,
  TemplateContentSection,
} from "@/context/BuilderContext";

type NormalizedMetaField = {
  key?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  description?: string;
  default?: string;
};

const SUPPORTED_FIELD_TYPES = new Set<TemplateContentField["type"]>([
  "text",
  "textarea",
  "email",
  "image",
  "gallery",
  "color",
]);

export function normalizeSectionAnchor(id?: string | null) {
  if (typeof id !== "string") {
    return null;
  }

  const trimmed = id.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function ensureColorValue(value: string | undefined) {
  if (!value) {
    return "#000000";
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

export function formatModuleType(type: TemplateModuleDefinition["type"]) {
  if (type === "iframe") {
    return "Iframe";
  }
  if (type === "integration") {
    return "Integration";
  }
  return "Form";
}

export function formatTokenLabel(token: string) {
  return token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function slugifySectionId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "general";
  }

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || trimmed;
}

function normaliseFieldType(type?: string | null): TemplateContentField["type"] {
  if (typeof type !== "string" || !type.trim()) {
    return "text";
  }

  const lower = type.trim().toLowerCase();
  if (SUPPORTED_FIELD_TYPES.has(lower as TemplateContentField["type"])) {
    return lower as TemplateContentField["type"];
  }

  if (lower === "richtext" || lower === "markdown" || lower === "longtext") {
    return "textarea";
  }

  if (lower.includes("email")) {
    return "email";
  }

  return "text";
}

function ensureMetaSection(
  map: Map<string, TemplateContentSection>,
  sectionId: string,
  label: string
) {
  const existing = map.get(sectionId);
  if (existing) {
    return existing;
  }

  const created: TemplateContentSection = {
    id: sectionId,
    label,
    fields: [],
  };

  map.set(sectionId, created);
  return created;
}

export function buildSectionsFromMetaFields(
  fields: NormalizedMetaField[] | null | undefined
): TemplateContentSection[] {
  if (!Array.isArray(fields) || fields.length === 0) {
    return [];
  }

  const sectionMap = new Map<string, TemplateContentSection>();

  fields.forEach((field) => {
    const key = typeof field.key === "string" ? field.key.trim() : "";
    if (!key) {
      return;
    }

    const [rawSection, ...rest] = key.split(".");
    const hasSection = rest.length > 0;
    const sectionId = hasSection ? slugifySectionId(rawSection) : "general";
    const sectionLabel = hasSection ? formatTokenLabel(rawSection) : "General";
    const targetSection = ensureMetaSection(sectionMap, sectionId, sectionLabel);

    const fieldLabel =
      typeof field.label === "string" && field.label.trim().length > 0
        ? field.label.trim()
        : formatTokenLabel((hasSection ? rest.join(".") : key) || key);

    const placeholder =
      typeof field.placeholder === "string" && field.placeholder.trim().length > 0
        ? field.placeholder
        : undefined;

    const description =
      typeof field.description === "string" && field.description.trim().length > 0
        ? field.description
        : undefined;

    const defaultValue =
      typeof field.default === "string" && field.default.length > 0
        ? field.default
        : undefined;

    const entry: TemplateContentField = {
      key,
      label: fieldLabel,
      type: normaliseFieldType(field.type),
      placeholder,
      description,
      defaultValue,
    };

    targetSection.fields.push(entry);
  });

  return Array.from(sectionMap.values()).filter((section) => section.fields.length > 0);
}
