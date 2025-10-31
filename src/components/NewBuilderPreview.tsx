"use client";
import { useEffect, useRef } from "react";
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
  theme?: {
    colors?: Record<string, string>;
    fonts?: { primary?: string };
  };
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
  const widthValue = DEVICE_WIDTHS[device] ?? DEVICE_WIDTHS.desktop;
  const previewWidth =
    typeof widthValue === "number" ? `${widthValue}px` : widthValue;

  useEffect(() => {
    if (!previewRef.current || !templateHtml) return;
    const doc = previewRef.current.contentDocument;
    if (!doc) return;

    const colorVars = Object.entries(data.theme?.colors || {})
      .map(([key, val]) => `${key}: ${val};`)
      .join("\n");

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            :root { ${colorVars} }
            body { font-family: ${data.theme?.fonts?.primary || "Inter"}, sans-serif; margin: 0; }
          </style>
        </head>
        <body>
          ${templateHtml
            .replace(/{{\s*title\s*}}/g, data.title)
            .replace(/{{\s*business\s*}}/g, data.business)}
        </body>
      </html>
    `);
    doc.close();
  }, [templateHtml, data]);

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
