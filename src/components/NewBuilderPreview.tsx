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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function NewBuilderPreview({ templateHtml, data, device }: NewBuilderPreviewProps) {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const previewInnerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [transformOrigin, setTransformOrigin] = useState("50% 0%");

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

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();

      if (previewInnerRef.current) {
        const rect = previewInnerRef.current.getBoundingClientRect();
        const originX = clamp(
          ((event.clientX - rect.left) / rect.width) * 100,
          0,
          100,
        );
        const originY = clamp(
          ((event.clientY - rect.top) / rect.height) * 100,
          0,
          100,
        );
        setTransformOrigin(`${originX}% ${originY}%`);
      }

      setZoom((prevZoom) => {
        const nextZoom = clamp(prevZoom - event.deltaY * 0.05, 25, 200);
        return nextZoom === prevZoom ? prevZoom : nextZoom;
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

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
      <div className="preview-zoom-indicator">{Math.round(zoom)}%</div>

      <div className="preview-canvas" ref={previewCanvasRef}>
        <div className="preview-device" style={{ width: scaledWidth, height: scaledHeight }}>
          <div
            ref={previewInnerRef}
            className="preview-device-inner"
            style={{
              width: deviceSize.width,
              height: deviceSize.height,
              transform: `scale(${zoomScale})`,
              transformOrigin,
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
