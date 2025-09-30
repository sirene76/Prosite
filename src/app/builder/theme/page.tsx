"use client";

import { useBuilder } from "@/context/BuilderContext";

const palettePresets = [
  {
    name: "Aurora",
    values: {
      primaryColor: "#38bdf8",
      secondaryColor: "#0ea5e9",
      accentColor: "#f472b6",
      backgroundColor: "#020617",
      textColor: "#e2e8f0"
    }
  },
  {
    name: "Luxe",
    values: {
      primaryColor: "#f59e0b",
      secondaryColor: "#d97706",
      accentColor: "#fde68a",
      backgroundColor: "#0b1120",
      textColor: "#f8fafc"
    }
  },
  {
    name: "Verdant",
    values: {
      primaryColor: "#34d399",
      secondaryColor: "#10b981",
      accentColor: "#86efac",
      backgroundColor: "#022c22",
      textColor: "#ecfdf5"
    }
  }
];

export default function ThemePage() {
  const { theme, updateTheme, selectedTemplate } = useBuilder();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Choose your visual identity</h2>
        <p className="text-sm text-slate-400">
          Select a palette and fine-tune the colors to match your brand. Switch templates anytime without losing
          progress.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {palettePresets.map((preset) => (
          <button
            type="button"
            key={preset.name}
            onClick={() => updateTheme(preset.values)}
            className="group rounded-2xl border border-slate-700/80 bg-slate-900/30 p-5 text-left transition hover:border-builder-accent"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-100">{preset.name}</p>
                <p className="text-sm text-slate-400">Curated colors for modern brands.</p>
              </div>
              <div className="flex gap-2">
                {Object.values(preset.values).slice(0, 3).map((value) => (
                  <span
                    key={value}
                    className="h-8 w-8 rounded-full border border-white/10"
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(theme).map(([key, value]) => (
          <label key={key} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-300">
              <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-xs text-slate-500">{value}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
              <input
                type="color"
                value={value}
                onChange={(event) => updateTheme({ [key]: event.target.value })}
                className="h-10 w-20 cursor-pointer rounded-md border border-slate-700 bg-slate-800"
              />
              <input
                type="text"
                value={value}
                onChange={(event) => updateTheme({ [key]: event.target.value })}
                className="flex-1 rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 focus:border-builder-accent focus:outline-none"
              />
            </div>
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold">Current template</h3>
        <p className="mt-1 text-sm text-slate-400">
          You&apos;re working with <span className="font-medium text-slate-200">{selectedTemplate.name}</span>.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Style</p>
            <p className="mt-1 font-medium">{selectedTemplate.category}</p>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pages</p>
            <p className="mt-1 font-medium">{selectedTemplate.pages.join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
