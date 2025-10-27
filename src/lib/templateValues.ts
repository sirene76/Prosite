export type WebsiteValues =
  | Record<string, unknown>
  | Map<string, unknown>
  | null
  | undefined;

function normaliseValues(values: WebsiteValues): Record<string, string> {
  if (!values || typeof values !== "object") {
    return {};
  }

  const result = new Map<string, string>();

  const walk = (prefix: string, value: unknown) => {
    if (value == null) {
      return;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result.set(prefix, String(value));
      return;
    }

    if (Array.isArray(value)) {
      result.set(
        prefix,
        value
          .map((item) => (typeof item === "string" ? item : String(item)))
          .join("\n")
      );
      return;
    }

    if (value instanceof Map) {
      value.forEach((childValue, childKey) => {
        const key = prefix ? `${prefix}.${String(childKey)}` : String(childKey);
        walk(key, childValue);
      });
      return;
    }

    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(
        ([childKey, childValue]) => {
          const key = prefix ? `${prefix}.${childKey}` : childKey;
          walk(key, childValue);
        }
      );
      return;
    }
  };

  const entries = values instanceof Map
    ? Array.from(values.entries(), ([key, value]) => [String(key), value] as const)
    : Object.entries(values);

  entries.forEach(([key, value]) => {
    walk(key, value);
  });

  return Object.fromEntries(result.entries());
}

function hasUsableValues(values: WebsiteValues): values is NonNullable<WebsiteValues> {
  if (!values || typeof values !== "object") {
    return false;
  }

  if (values instanceof Map) {
    return values.size > 0;
  }

  return Object.keys(values as Record<string, unknown>).length > 0;
}

function resolveWebsiteValues(content: WebsiteValues, fallback: WebsiteValues): WebsiteValues {
  if (hasUsableValues(content)) {
    return content;
  }

  if (hasUsableValues(fallback)) {
    return fallback;
  }

  return {};
}

export function deriveTemplateValues(
  content: WebsiteValues,
  fallback: WebsiteValues
) {
  const rawValues = resolveWebsiteValues(content, fallback);
  return normaliseValues(rawValues);
}

