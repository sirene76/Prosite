import type { TemplateFieldDefinition, TemplateModuleDefinition } from "@/lib/templates";

type FieldSource =
  | TemplateFieldDefinition[]
  | Record<string, unknown>
  | null
  | undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSentence(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function normaliseDefault(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const flattened = value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "")))
      .filter((item) => item.length > 0);
    return flattened.join("\n");
  }
  if (value == null) {
    return undefined;
  }
  return String(value);
}

function toFieldDefinition(
  id: string,
  config: unknown
): TemplateFieldDefinition | null {
  if (!id.trim()) {
    return null;
  }

  if (!isPlainObject(config)) {
    return {
      id: id.trim(),
      label: toSentence(id),
    };
  }

  const field = config as Record<string, unknown>;
  const label =
    typeof field.label === "string" && field.label.trim()
      ? field.label.trim()
      : toSentence(id.split(".").pop() ?? id);

  return {
    id: id.trim(),
    label,
    type: typeof field.type === "string" ? field.type : undefined,
    placeholder:
      typeof field.placeholder === "string" && field.placeholder.trim()
        ? field.placeholder
        : undefined,
    description:
      typeof field.description === "string" && field.description.trim()
        ? field.description
        : undefined,
    default: normaliseDefault(field.default),
  };
}

export function normaliseTemplateFields(source: FieldSource): TemplateFieldDefinition[] {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .map((field) => {
        if (!isPlainObject(field)) {
          return null;
        }
        const id = typeof field.id === "string" ? field.id : "";
        if (!id.trim()) {
          return null;
        }
        return {
          id: id.trim(),
          label:
            typeof field.label === "string" && field.label.trim()
              ? field.label.trim()
              : toSentence(id.split(".").pop() ?? id),
          type: typeof field.type === "string" ? field.type : undefined,
          placeholder:
            typeof field.placeholder === "string" && field.placeholder.trim()
              ? field.placeholder
              : undefined,
          description:
            typeof field.description === "string" && field.description.trim()
              ? field.description
              : undefined,
          default: normaliseDefault(field.default),
        } satisfies TemplateFieldDefinition;
      })
      .filter((field): field is TemplateFieldDefinition => field !== null);
  }

  if (isPlainObject(source)) {
    return Object.entries(source)
      .map(([id, config]) => toFieldDefinition(id, config))
      .filter((field): field is TemplateFieldDefinition => field !== null);
  }

  return [];
}

export function buildModulePageMap(modules: TemplateModuleDefinition[] = []) {
  return modules.reduce<Record<string, TemplateModuleDefinition>>((acc, item) => {
    if (item && typeof item.id === "string") {
      acc[item.id] = item;
    }
    return acc;
  }, {});
}

export function resolveSectionLabel(
  sectionId: string,
  modules: Record<string, TemplateModuleDefinition>
) {
  const moduleEntry = modules[sectionId];
  if (moduleEntry?.label) {
    return moduleEntry.label;
  }
  return toSentence(sectionId);
}

export function buildFieldDefaults(
  fields: TemplateFieldDefinition[]
): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    const key = field.id?.trim();
    if (!key) {
      return acc;
    }
    if (typeof field.default === "string") {
      acc[key] = field.default;
    }
    return acc;
  }, {});
}
