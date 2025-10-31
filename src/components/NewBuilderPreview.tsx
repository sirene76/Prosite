"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceMode } from "@/components/DeviceToolbar";

const DEVICE_SIZES: Record<DeviceMode, { width: number; height: number }> = {
  desktop: { width: 1200, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 414, height: 844 },
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
};

export default function NewBuilderPreview({ templateHtml, data, device }: NewBuilderPreviewProps) {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(100);

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

  const deviceSize = useMemo(() => DEVICE_SIZES[device] ?? DEVICE_SIZES.desktop, [device]);
  const zoomScale = zoom / 100;
  const scaledWidth = deviceSize.width * zoomScale;
  const scaledHeight = deviceSize.height * zoomScale;

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

  return (
    <div className="preview-content">
      <div className="zoom-controls">
        <label htmlFor="zoom-slider">Zoom</label>
        <input
          id="zoom-slider"
          type="range"
          min={25}
          max={150}
          step={5}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
        <span className="zoom-value">{zoom}%</span>
      </div>

      <div className="preview-canvas">
        <div className="preview-device" style={{ width: scaledWidth, height: scaledHeight }}>
          <div
            className="preview-device-inner"
            style={{
              width: deviceSize.width,
              height: deviceSize.height,
              transform: `scale(${zoomScale})`,
            }}
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
