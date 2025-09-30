"use client";

import clsx from "clsx";
import { useBuilder } from "@/context/BuilderContext";

const devices = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" }
] as const;

export function DeviceControls() {
  const { device, setDevice } = useBuilder();

  return (
    <div className="flex items-center gap-2">
      {devices.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => setDevice(item.id)}
          className={clsx(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition",
            device === item.id
              ? "border-builder-accent bg-builder-accent/20 text-builder-accent"
              : "border-slate-700/70 text-slate-400 hover:border-builder-accent/40 hover:text-slate-200"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
