const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export type DefaultField = { id: string; default?: string };

export function buildDefaultContent(fields: DefaultField[] = []) {
  const content: Record<string, unknown> = {};

  for (const field of fields) {
    if (!field || typeof field.id !== "string") {
      continue;
    }

    const parts = field.id
      .split(".")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      continue;
    }

    let current: Record<string, unknown> = content;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        current[part] = field.default ?? "";
        continue;
      }

      const existing = current[part];
      if (!isRecord(existing)) {
        current[part] = {};
      }

      current = current[part] as Record<string, unknown>;
    }
  }

  return content;
}

export function mergeNestedContent(
  ...sources: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!isRecord(source)) {
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      if (isRecord(value)) {
        const existing = result[key];
        result[key] = isRecord(existing)
          ? mergeNestedContent(existing, value)
          : mergeNestedContent(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}
