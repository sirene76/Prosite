export type SlugifyOptions = {
  lower?: boolean;
  strict?: boolean;
  replacement?: string;
};

const DEFAULT_REPLACEMENT = "-";

function removeDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function collapseSeparators(value: string, replacement: string): string {
  const pattern = new RegExp(`${replacement}+`, "g");
  return value.replace(pattern, replacement);
}

export default function slugify(value: string, options: SlugifyOptions = {}): string {
  const replacement = options.replacement ?? DEFAULT_REPLACEMENT;

  let slug = String(value ?? "");
  if (!slug) return "";

  slug = removeDiacritics(slug)
    .replace(/[^A-Za-z0-9]+/g, replacement)
    .trim();

  slug = collapseSeparators(slug, replacement)
    .replace(new RegExp(`^${replacement}`), "")
    .replace(new RegExp(`${replacement}$`), "");

  if (options.lower) {
    slug = slug.toLowerCase();
  }

  if (options.strict) {
    const allowed = replacement === "-" ? "-" : "";
    const strictPattern = new RegExp(`[^a-z0-9${allowed}]`, "gi");
    slug = slug.replace(strictPattern, "");
    slug = collapseSeparators(slug, replacement);
  }

  return slug;
}
