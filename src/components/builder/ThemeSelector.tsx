"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { useBuilder } from "@/context/BuilderContext";

const palettePresets = [
  {
    name: "Aurora",
    colors: {
      primaryColor: "#38bdf8",
      secondaryColor: "#0ea5e9",
      accentColor: "#f472b6",
      backgroundColor: "#020617",
      textColor: "#e2e8f0",
    },
  },
  {
    name: "Luxe",
    colors: {
      primaryColor: "#f59e0b",
      secondaryColor: "#d97706",
      accentColor: "#fde68a",
      backgroundColor: "#0b1120",
      textColor: "#f8fafc",
    },
  },
  {
    name: "Verdant",
    colors: {
      primaryColor: "#34d399",
      secondaryColor: "#10b981",
      accentColor: "#86efac",
      backgroundColor: "#022c22",
      textColor: "#ecfdf5",
    },
  },
] as const;

const colorFields: { key: keyof typeof palettePresets[number]["colors"]; label: string }[] = [
  { key: "primaryColor", label: "Primary" },
  { key: "secondaryColor", label: "Secondary" },
  { key: "accentColor", label: "Accent" },
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
];

export function ThemeSelector() {
  const { theme, updateTheme } = useBuilder();

  const activePalette = useMemo(() => {
    return palettePresets.find((preset) => {
      return colorFields.every((field) => preset.colors[field.key] === theme[field.key]);
    });
  }, [theme]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Palettes</p>
        <div className="space-y-2">
          {palettePresets.map((preset) => {
            const isActive = activePalette?.name === preset.name;

            return (
              <button
                type="button"
                key={preset.name}
                onClick={() => updateTheme(preset.colors)}
                className={clsx(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-builder-accent/70 bg-gray-950"
                    : "border-gray-800 bg-gray-900/40 hover:border-builder-accent/40"
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{preset.name}</p>
                  <p className="text-xs text-slate-500">Click to apply this palette</p>
                </div>
                <div className="flex items-center gap-2">
                  {colorFields.slice(0, 3).map((field) => (
                    <span
                      key={field.key}
                      className="h-7 w-7 rounded-full border border-white/10"
                      style={{ backgroundColor: preset.colors[field.key] }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fine tune colors</p>
        <div className="space-y-3">
          {colorFields.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
              <div
                className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
                style={{ backgroundColor: theme[key] }}
              />
              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme[key] ?? ""}
                    onChange={(event) => updateTheme({ [key]: event.target.value })}
                    className="h-8 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
                  />
                  <input
                    type="text"
                    value={theme[key] ?? ""}
                    onChange={(event) => updateTheme({ [key]: event.target.value })}
                    className="flex-1 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-100 focus:border-builder-accent focus:outline-none"
                  />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
