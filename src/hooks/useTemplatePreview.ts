"use client";
import { useEffect, useState } from "react";

export type TemplateTheme = {
  name: string;
  colors?: Record<string, string>;
};

export type TemplateMeta = {
  themes?: TemplateTheme[];
  [key: string]: unknown;
};

export function useTemplatePreview(htmlUrl?: string, cssUrl?: string, metaUrl?: string) {
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [meta, setMeta] = useState<TemplateMeta | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!htmlUrl || !cssUrl) {
        setHtml("");
        setCss("");
        setMeta(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [htmlData, cssData, metaData] = await Promise.all([
          fetch(htmlUrl).then((response) => response.text()),
          fetch(cssUrl).then((response) => response.text()),
          metaUrl
            ? fetch(metaUrl).then((response) => response.json() as Promise<TemplateMeta>)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setHtml(htmlData);
        setCss(cssData);
        setMeta(metaData);
      } catch (error) {
        if (!cancelled) {
          console.error("Preview load failed", error);
          setHtml("");
          setCss("");
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [htmlUrl, cssUrl, metaUrl]);

  return { ready: !!html && !!css, html, css, meta, loading };
}
