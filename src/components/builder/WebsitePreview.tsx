"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useBuilder } from "@/context/BuilderContext";
import { renderTemplate } from "@/lib/renderTemplate";

const deviceWidths: Record<"desktop" | "tablet" | "mobile", string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px"
};

type TemplatePayload = {
  html: string;
  css: string;
};

export function WebsitePreview() {
  const { device, selectedTemplate, theme, content, updatePreviewDocument } = useBuilder();
  const [assets, setAssets] = useState<TemplatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplate = async () => {
      setIsLoading(true);
      setAssets(null);
      try {
        const response = await fetch(`/api/templates/${encodeURIComponent(selectedTemplate.id)}`);
        if (!response.ok) {
          throw new Error("Unable to load template");
        }
        const data = (await response.json()) as TemplatePayload;
        if (isMounted) {
          setAssets(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTemplate();
    return () => {
      isMounted = false;
    };
  }, [selectedTemplate.id]);

  const mergedData = useMemo(() => ({ ...theme, ...content }), [content, theme]);

  const srcDoc = useMemo(() => {
    if (!assets) {
      return "";
    }

    const themedCss = `:root { --primary-color: ${theme.primaryColor}; --secondary-color: ${theme.secondaryColor}; --accent-color: ${theme.accentColor}; --background-color: ${theme.backgroundColor}; --text-color: ${theme.textColor}; } ${assets.css}`;

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${themedCss}</style></head><body>${renderTemplate(assets.html, mergedData)}</body></html>`;

    return html;
  }, [assets, mergedData, theme.accentColor, theme.backgroundColor, theme.primaryColor, theme.secondaryColor, theme.textColor]);

  useEffect(() => {
    updatePreviewDocument(srcDoc);
  }, [srcDoc, updatePreviewDocument]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-slate-950/40 px-6 py-8">
      <div className="flex w-full max-w-6xl items-center justify-start pb-4 text-sm text-slate-400">
        <p>
          Previewing <span className="font-medium text-slate-200">{selectedTemplate.name}</span>
        </p>
      </div>
      <div className="flex h-full w-full flex-1 items-start justify-center overflow-hidden">
        <div
          className={clsx(
            "relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 shadow-xl shadow-black/40 transition-all",
            device === "mobile" && "py-8"
          )}
        >
          {isLoading ? (
            <div className="text-sm text-slate-400">Loading preview...</div>
          ) : assets ? (
            <div
              className={clsx(
                "flex h-full w-full items-center justify-center",
                device === "desktop" && "px-6",
                device === "tablet" && "px-6",
                device === "mobile" && "px-0"
              )}
              style={{ maxWidth: deviceWidths[device] }}
            >
              <iframe
                key={`${selectedTemplate.id}-${device}`}
                title="Website preview"
                srcDoc={srcDoc}
                className="h-full w-full rounded-[22px] border border-slate-800/50 bg-white shadow-inner transition-all"
              />
            </div>
          ) : (
            <div className="max-w-sm text-center text-sm text-rose-400">
              We couldn&apos;t load the template preview. Please refresh and try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
