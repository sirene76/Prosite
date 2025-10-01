"use client";

import clsx from "clsx";
import { Monitor, Smartphone, Tablet } from "lucide-react";

import { useBuilder } from "@/context/BuilderContext";

const devices = [
  { id: "desktop", label: "Desktop", Icon: Monitor },
  { id: "tablet", label: "Tablet", Icon: Tablet },
  { id: "mobile", label: "Mobile", Icon: Smartphone }
] as const;

export function DeviceControls() {
  const { device, setDevice } = useBuilder();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {devices.map((item) => {
          const Icon = item.Icon;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setDevice(item.id)}
              title={item.label}
              aria-label={item.label}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full border transition",
                device === item.id
                  ? "border-builder-accent bg-builder-accent/20 text-builder-accent"
                  : "border-slate-700/70 text-slate-400 hover:border-builder-accent/40 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
