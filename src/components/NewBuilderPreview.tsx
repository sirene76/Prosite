"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeviceMode } from "@/components/DeviceToolbar";

const DEVICE_WIDTHS: Record<DeviceMode, number | "100%"> = {
  desktop: "100%",
  tablet: 768,
  mobile: 375,
};

type BuilderPreviewData = {
  title: string;
  business: string;
  logo?: string;
  content: Record<string, unknown>;
  theme?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  } | null;
};

type NewBuilderPreviewProps = {
  templateHtml: string;
  data: BuilderPreviewData;
  device: DeviceMode;
  zoom: number;
};

export default function NewBuilderPreview({
  templateHtml,
  data,
  device,
  zoom,
}: NewBuilderPreviewProps) {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const widthValue = DEVICE_WIDTHS[device] ?? DEVICE_WIDTHS.desktop;
  const previewWidth =
    typeof widthValue === "number" ? `${widthValue}px` : widthValue;

  const applyThemeToIframe = useCallback((theme: BuilderPreviewData["theme"]) => {
    const doc = previewRef.current?.contentDocument;
    if (!doc) return;

    const head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
    if (!head) return;

    const styleId = "__builder_preview_theme";
    let styleElement = doc.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = doc.createElement("style");
      styleElement.id = styleId;
      head.appendChild(styleElement);
    }

    const colorLines = Object.entries(theme?.colors || {})
      .map(([key, val]) => `  ${key}: ${val};`)
      .join("\n");
    const primaryFont = theme?.fonts?.primary;
    const fontFamily = primaryFont ? `${primaryFont}, sans-serif` : "Inter, sans-serif";

    styleElement.textContent = `:root {\n${colorLines}\n}\nbody {\n  margin: 0;\n  font-family: ${fontFamily};\n}`;
  }, []);

  useEffect(() => {
    const iframe = previewRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIframeReady(true);
    };

    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!templateHtml) {
      setIframeReady(false);
      return;
    }

    const iframe = previewRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    setIframeReady(false);

    doc.open();
    doc.write(templateHtml);
    doc.close();

    const script = doc.createElement("script");
    script.src = "/preview-script.js";
    script.async = false;
    script.defer = false;
    (doc.body ?? doc.documentElement).appendChild(script);
  }, [templateHtml]);

  useEffect(() => {
    applyThemeToIframe(data.theme ?? null);
  }, [applyThemeToIframe, data.theme, templateHtml]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== previewRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const { type } = event.data as { type?: string };
      if (type === "preview-script-loaded") {
        setIframeReady(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const contentPayload = useMemo(() => {
    const base: Record<string, unknown> = {
      ...data.content,
    };

    if (typeof data.title === "string" && data.title.length > 0) {
      base.title = data.title;
    }

    if (typeof data.business === "string" && data.business.length > 0) {
      base.business = data.business;
      const businessName = base.businessName;
      if (typeof businessName !== "string" || businessName.length === 0) {
        base.businessName = data.business;
      }
    }

    if (data.logo) {
      base.logo = data.logo;
      const logoUrl = base.logoUrl;
      if (typeof logoUrl !== "string" || logoUrl.length === 0) {
        base.logoUrl = data.logo;
      }
    }

    return base;
  }, [data.content, data.title, data.business, data.logo]);

  useEffect(() => {
    if (!iframeReady) return;
    const targetWindow = previewRef.current?.contentWindow;
    if (!targetWindow) return;
    targetWindow.postMessage({ type: "update-content", payload: contentPayload }, "*");
  }, [iframeReady, contentPayload]);

  useEffect(() => {
    if (!iframeReady) return;
    const targetWindow = previewRef.current?.contentWindow;
    if (!targetWindow) return;
    targetWindow.postMessage({ type: "update-theme", payload: data.theme ?? null }, "*");
  }, [iframeReady, data.theme]);

  const handleFullPreview = () => {
    if (!previewRef.current) return;
    const doc = previewRef.current.contentDocument;
    if (!doc) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) return;
    previewWindow.document.open();
    previewWindow.document.write(doc.documentElement.outerHTML);
    previewWindow.document.close();
  };

  useEffect(() => {
    const handleScrollMessage = (event: MessageEvent) => {
      if (event.origin && event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;
      const { scrollTo } = event.data as { scrollTo?: string };
      if (!scrollTo || typeof scrollTo !== "string") return;

      const iframeDocument = previewRef.current?.contentDocument;
      if (!iframeDocument) return;

      const target = iframeDocument.getElementById(scrollTo);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    window.addEventListener("message", handleScrollMessage);
    return () => window.removeEventListener("message", handleScrollMessage);
  }, []);

  return (
    <div
      className="preview-wrapper"
      style={{ height: "calc(100vh - 120px)", overflow: "hidden" }}
    >
      <div className="preview-canvas">
        <div className="preview-device" style={{ width: previewWidth }}>
          <div
            className="preview-scale"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div className="browser">
              <div className="browser-bar">
                <div className="browser-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="browser-url">
                  {data.logo ? (
                    <img src={data.logo} alt="Logo" />
                  ) : (
                    <img
                      src="https://dummyimage.com/16x16/3b82f6/fff.png&text=P"
                      alt="Logo"
                    />
                  )}
                  <span className="title">{data.title || "Loading..."}</span>
                </div>
              </div>
              <iframe
                ref={previewRef}
                className="browser-screen"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="preview-footer">
        <button className="btn-primary" type="button" onClick={handleFullPreview}>
          Full Preview
        </button>
      </div>
    </div>
  );
}
