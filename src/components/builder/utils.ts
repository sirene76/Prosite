import type { TemplateModuleDefinition } from "@/lib/templates";

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
