"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBuilder } from "@/context/BuilderContext";
import { injectThemeTokens, renderTemplate } from "@/lib/renderTemplate";
import { useBuilderStore } from "@/store/builderStore";

const DEVICE_WIDTHS = {
  desktop: 1440,
  tablet: 768,
  mobile: 375
} as const;

const DEVICE_HEIGHTS = {
  desktop: 1024,
  tablet: 1366,
  mobile: 1024
} as const;

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 2] as const;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

type TemplatePayload = {
  html: string;
  css: string;
};

export function WebsitePreview() {
  const {
    device,
    registerPreviewFrame,
    selectedTemplate,
    theme,
    themeDefaults,
    content,
    registerContentPlaceholders,
    registerThemeDefaults,
    updatePreviewDocument,
    openPreview,
    previewDocument,
    isPreviewReady
  } = useBuilder();
  const [assets, setAssets] = useState<TemplatePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const [isAutoFit, setIsAutoFit] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const storeTheme = useBuilderStore((state) => state.theme);
  const storeValues = useBuilderStore((state) => state.values);
  const setIframeRef = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node;
      registerPreviewFrame(node);
    },
    [registerPreviewFrame]
  );

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(3))));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplate = async () => {
      setIsLoading(true);
      setAssets(null);
      try {
        const response = await fetch(`/api/templates/${selectedTemplate.id}`);
        if (!response.ok) {
          throw new Error("Unable to load template");
        }
        const data = (await response.json()) as {
          html?: string;
          css?: string;
        };
        if (isMounted) {
          const html = data.html ?? selectedTemplate.html ?? "";
          const css = data.css ?? selectedTemplate.css ?? "";
          const placeholders = extractPlaceholders(html);
          const colorDefaults = extractColorDefaults(
            css,
            selectedTemplate.colors.map((color) => color.id)
          );
          const fontDefaults = extractFontDefaults(css, selectedTemplate.fonts);

          registerContentPlaceholders(placeholders);
          registerThemeDefaults({ colors: colorDefaults, fonts: fontDefaults });

          setAssets({ html, css });
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
  }, [
    registerContentPlaceholders,
    registerThemeDefaults,
    selectedTemplate.colors,
    selectedTemplate.fonts,
    selectedTemplate.id,
    selectedTemplate.html,
    selectedTemplate.css,
  ]);

  const mergedData = useMemo(() => {
    const baseContent = typeof content === "object" && content !== null ? content : {};
    return { ...baseContent, ...storeValues } as Record<string, unknown>;
  }, [content, storeValues]);

  const getStoreThemeColor = useCallback(
    (key: string) => {
      const value = storeTheme[key];
      return typeof value === "string" && value.trim() ? value : undefined;
    },
    [storeTheme]
  );

  useEffect(() => {
    if (!assets) {
      updatePreviewDocument("");
      return;
    }

    const timeout = setTimeout(() => {
      const colorPalette: Record<string, string> = {};
      selectedTemplate.colors.forEach((color) => {
        const key = color.id;
        const value =
          storeTheme[key] ?? theme.colors[key] ?? themeDefaults.colors[key] ?? color.default;
        if (value) {
          colorPalette[key] = value;
        }
      });

      Object.entries(storeTheme).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim()) {
          colorPalette[key] = value;
        }
      });

      const fontTokens: Record<string, string> = {};
      selectedTemplate.fonts.forEach((key) => {
        const value = theme.fonts[key] ?? themeDefaults.fonts[key] ?? "";
        if (value) {
          fontTokens[key] = value;
        }
      });

      const rendered = renderTemplate({
        html: assets.html,
        values: mergedData,
        modules: selectedTemplate.modules,
        theme: {
          primary: colorPalette.primary ?? getStoreThemeColor("primary"),
          secondary: colorPalette.secondary ?? getStoreThemeColor("secondary"),
          background: colorPalette.background ?? getStoreThemeColor("background"),
          text: colorPalette.text ?? getStoreThemeColor("text"),
        },
        themeTokens: {
          colors: colorPalette,
          fonts: fontTokens,
        },
      });

      const themedDocument = injectThemeTokens({
        html: rendered,
        css: assets.css,
        colors: colorPalette,
        fonts: fontTokens,
      });

      const finalDoc = injectScrollScript(themedDocument);
      updatePreviewDocument(finalDoc);
    }, 150);

    return () => clearTimeout(timeout);
  }, [
    assets,
    content,
    getStoreThemeColor,
    mergedData,
    selectedTemplate.colors,
    selectedTemplate.fonts,
    selectedTemplate.modules,
    storeTheme,
    theme,
    themeDefaults,
    updatePreviewDocument,
  ]);

  const handleZoomIn = useCallback(() => {
    setIsAutoFit(false);
    setZoom((current) => {
      const nextLevel = ZOOM_LEVELS.find((level) => level > current + 0.0001);
      if (!nextLevel) {
        return MAX_ZOOM;
      }
      return nextLevel;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setIsAutoFit(false);
    setZoom((current) => {
      const reversedLevels = [...ZOOM_LEVELS].reverse();
      const nextLevel = reversedLevels.find((level) => level < current - 0.0001);
      if (!nextLevel) {
        return MIN_ZOOM;
      }
      return nextLevel;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setIsAutoFit(false);
    setZoom(1);
  }, []);

  const handleFitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const width = DEVICE_WIDTHS[device];
    const availableWidth = container.clientWidth;
    if (availableWidth <= 0) {
      return;
    }

    const targetScale = clampZoom(availableWidth / width);

    setZoom(targetScale);
    setIsAutoFit(true);
    container.scrollTo({ top: 0, left: 0 });
  }, [clampZoom, device]);

  useEffect(() => {
    if (!assets || !isAutoFit) {
      return;
    }
    handleFitToScreen();
  }, [assets, device, handleFitToScreen, isAutoFit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      setIsAutoFit(false);

      setZoom((current) => {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const next = clampZoom(current + delta);
        return next;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [clampZoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (isAutoFit) {
        handleFitToScreen();
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [handleFitToScreen, isAutoFit]);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      const response = await fetch("/api/templates/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          content,
          theme,
          themeDefaults,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTemplate.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Unable to export template", error);
    } finally {
      setIsExporting(false);
    }
  }, [content, isExporting, selectedTemplate.id, theme, themeDefaults]);

  const currentWidth = DEVICE_WIDTHS[device];
  const currentHeight = DEVICE_HEIGHTS[device];
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between px-2 text-xs uppercase tracking-[0.3em] text-slate-500 sm:px-0">
        <span className="text-slate-400">
          Previewing <span className="text-slate-200">{selectedTemplate.name}</span>
        </span>
        <span className="text-slate-500">{device.toUpperCase()} • {zoomLabel}</span>
      </div>
      <div className="flex flex-1 justify-center bg-gray-950 p-4">
        <div className="relative flex w-full max-w-[1800px] flex-col items-center">
          <div
            ref={containerRef}
            className="relative flex h-[85vh] w-full items-start justify-center overflow-auto rounded-[32px] border border-gray-900/70 bg-gray-900/40"
          >
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                Loading preview...
              </div>
            ) : assets ? (
              <div
                className="pointer-events-auto"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center"
                }}
              >
                <div
                  className={clsx(
                    "mx-auto overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80 shadow-[0_45px_90px_-40px_rgba(0,0,0,0.85)] transition-all duration-300",
                    {
                      "w-[375px]": device === "mobile",
                      "w-[768px]": device === "tablet",
                      "w-[1440px]": device === "desktop",
                    }
                  )}
                  style={{ width: `${currentWidth}px` }}
                >
                  <div className="flex items-center gap-3 border-b border-gray-800/70 bg-gray-900 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1 rounded-md bg-gray-800/70 px-3 py-1 text-[11px] text-slate-400">
                      preview.prosite/{device}
                    </div>
                  </div>
                  <iframe
                    ref={setIframeRef}
                    id="livePreview"
                    title="Website preview"
                    data-preview-frame="true"
                    className="w-full border-0 bg-white transition-all duration-300"
                    style={{
                      height: `${currentHeight}px`
                    }}
                    srcDoc={previewDocument}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-rose-400">
                We couldn&apos;t load the template preview. Please refresh and try again.
              </div>
            )}

            <div className="pointer-events-none absolute right-6 top-6 flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM + 0.0001}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-gray-800 bg-gray-950/80 px-3 text-sm font-medium text-slate-200 transition hover:border-builder-accent/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-gray-800 bg-gray-950/80 px-3 text-sm font-medium text-slate-200 transition hover:border-builder-accent/60 hover:text-white"
              >
                {zoomLabel}
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM - 0.0001}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-gray-800 bg-gray-950/80 px-3 text-sm font-medium text-slate-200 transition hover:border-builder-accent/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-gray-800 bg-gray-950/80 px-3 text-sm font-medium text-slate-200 transition hover:border-builder-accent/60 hover:text-white"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={openPreview}
                disabled={!isPreviewReady}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-builder-accent/60 bg-gray-950/80 px-3 text-sm font-medium text-builder-accent transition hover:border-builder-accent hover:bg-builder-accent/10 hover:text-builder-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Full Preview
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={!isPreviewReady || isExporting}
                className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-emerald-500/40 bg-gray-950/80 px-3 text-sm font-medium text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isExporting ? "Exporting…" : "Export"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function injectScrollScript(html: string) {
  if (!html) {
    return html;
  }

  const script = `\n<script>\n  window.addEventListener("message", (e) => {\n    if (e.data?.type !== "scrollTo") return;\n    if (typeof e.data.anchor !== "string") return;\n    try {\n      const target = document.querySelector(e.data.anchor);\n      if (target) {\n        target.scrollIntoView({ behavior: "smooth" });\n      }\n    } catch (err) {\n      /* ignored */\n    }\n  });\n</script>\n`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${script}</body>`);
  }

  return `${html}${script}`;
}

function extractPlaceholders(html: string) {
  const matches = html.match(/{{(.*?)}}/g) ?? [];
  const result = new Set<string>();
  matches.forEach((match) => {
    const key = match.slice(2, -2).trim();
    if (key) {
      result.add(key);
    }
  });
  return Array.from(result);
}

function extractColorDefaults(css: string, keys: string[]) {
  const defaults: Record<string, string> = {};
  keys.forEach((key) => {
    const pattern = new RegExp(`var\\(\\s*--(?:color-)?${escapeRegExp(key)}(?:-color)?\\s*,\\s*([^\\)]+)\\)`, "gi");
    const match = pattern.exec(css);
    if (match) {
      defaults[key] = match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  });
  return defaults;
}

function extractFontDefaults(css: string, keys: string[]) {
  const defaults: Record<string, string> = {};
  keys.forEach((key) => {
    const pattern = new RegExp(`var\\(\\s*--font-${escapeRegExp(key)}\\s*,\\s*([^\\)]+)\\)`, "gi");
    const match = pattern.exec(css);
    if (match) {
      defaults[key] = match[1].trim();
    }
  });
  return defaults;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
