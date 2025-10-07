export function createSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseMeta(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }

    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch (cause) {
      throw new Error("Invalid meta JSON", { cause });
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (value === undefined || value === null) {
    return {};
  }

  throw new Error("Invalid meta JSON");
}
