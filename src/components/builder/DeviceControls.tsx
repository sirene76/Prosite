"use client";

import clsx from "clsx";
import { useBuilder } from "@/context/BuilderContext";

const devices = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" }
] as const;

export function DeviceControls() {
  const { device, setDevice, previewDocument } = useBuilder();

  const handleFullPreview = () => {
    if (!previewDocument) return;

    const blob = new Blob([previewDocument], { type: "text/html" });
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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/40 p-1">
        {devices.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setDevice(item.id)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              device === item.id
                ? "bg-builder-accent text-slate-950 shadow"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleFullPreview}
        disabled={!previewDocument}
        className="rounded-full border border-builder-accent/60 px-5 py-1.5 text-sm font-semibold text-builder-accent transition hover:bg-builder-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Full Preview
      </button>
    </div>
  );
}
