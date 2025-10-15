import { useEffect, useState } from "react";

import { normaliseTemplateFields } from "@/lib/templateFieldUtils";

export type TemplateMetaDescriptor = {
  id?: string;
  metaUrl?: string | null;
};

export type TemplateMeta = {
  pages?: Array<{ id: string; label: string; scrollAnchor?: string }>;
  fields?: Array<{ key: string; label: string; type?: string }>;
  themes?: Array<{ name: string; colors: Record<string, string> }>;
  [key: string]: unknown;
};

const SESSION_KEY_PREFIX = "prosite:template-meta:";

export function useTemplateMeta(template?: TemplateMetaDescriptor | null) {
  const [meta, setMeta] = useState<TemplateMeta | null>(null);

  useEffect(() => {
    const metaUrl = template?.metaUrl;
    const templateId = template?.id;
    if (!metaUrl) {
      setMeta(null);
      return;
    }

    let isMounted = true;

    const cacheKey = templateId ? `${SESSION_KEY_PREFIX}${templateId}` : null;
    const cachedMeta =
      typeof window !== "undefined" && cacheKey
        ? sessionStorage.getItem(cacheKey)
        : null;

    if (cachedMeta) {
      try {
        const parsed = JSON.parse(cachedMeta) as TemplateMeta;
        setMeta(parsed);
      } catch {
        if (cacheKey) {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    fetch(metaUrl)
      .then((response) => response.json())
      .then((data: unknown) => {
        if (!isMounted) return;
        const parsed = (data ?? null) as TemplateMeta | null;

        if (parsed) {
          const rawFields = (data as { fields?: unknown })?.fields;
          const normalisedFields = normaliseTemplateFields(rawFields);
          if (normalisedFields.length > 0) {
            parsed.fields = normalisedFields.map((field) => ({
              key: field.id,
              label: field.label ?? field.id,
              type: typeof field.type === "string" ? field.type : undefined,
            }));
          }
        }

        setMeta(parsed);
        if (cacheKey && typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setMeta(null);
        if (cacheKey && typeof window !== "undefined") {
          sessionStorage.removeItem(cacheKey);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [template?.id, template?.metaUrl]);

  return meta;
}
