"use client";
import { useEffect, useState } from "react";

export function useTemplatePreview(htmlUrl?: string, cssUrl?: string, metaUrl?: string) {
  const [html, setHtml] = useState<string>("");
  const [css, setCss] = useState<string>("");
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (htmlUrl) setHtml(await fetch(htmlUrl).then(r => r.text()).catch(() => ""));
      if (cssUrl) setCss(await fetch(cssUrl).then(r => r.text()).catch(() => ""));
      if (metaUrl) setMeta(await fetch(metaUrl).then(r => r.json()).catch(() => null));
    }
    load();
  }, [htmlUrl, cssUrl, metaUrl]);

  if (!html && !css) return { ready: false, html: "", css: "", meta: null };
  return { ready: true, html, css, meta };
}
