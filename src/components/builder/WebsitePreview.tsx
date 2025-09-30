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
  const { device, selectedTemplate, theme, content } = useBuilder();
  const [assets, setAssets] = useState<TemplatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplate = async () => {
      setIsLoading(true);
      setAssets(null);
      try {
        const response = await fetch(`/api/websites?templateId=${encodeURIComponent(selectedTemplate.id)}`);
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

  const handleFullPreview = () => {
    if (!srcDoc) return;
    const blob = new Blob([srcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank");
    if (previewWindow) {
      previewWindow.focus();
    }
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-slate-950/40 px-6 py-8">
      <div className="flex w-full max-w-5xl items-center justify-between pb-4 text-sm text-slate-400">
        <p>
          Previewing <span className="font-medium text-slate-200">{selectedTemplate.name}</span>
        </p>
        <button
          type="button"
          onClick={handleFullPreview}
          disabled={!assets}
          className="rounded-full border border-builder-accent/60 px-4 py-1.5 text-xs font-semibold text-builder-accent transition hover:bg-builder-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Full Preview
        </button>
      </div>
      <div className="flex h-full w-full flex-1 items-center justify-center overflow-hidden">
        <div
          className={clsx(
            "relative flex h-full max-h-[640px] flex-1 items-center justify-center rounded-3xl border border-slate-800/60 bg-slate-900/60 shadow-xl shadow-black/40",
            device === "mobile" && "py-8"
          )}
        >
          {isLoading ? (
            <div className="text-sm text-slate-400">Loading preview...</div>
          ) : assets ? (
            <iframe
              key={`${selectedTemplate.id}-${device}`}
              title="Website preview"
              srcDoc={srcDoc}
              style={{ width: deviceWidths[device], height: "100%" }}
              className={clsx(
                "h-full rounded-[22px] border border-slate-800/50 bg-white shadow-inner",
                device === "desktop" && "mx-6",
                device === "tablet" && "mx-6",
                device === "mobile" && "mx-0 h-[640px] max-h-full w-[390px]"
              )}
            />
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
