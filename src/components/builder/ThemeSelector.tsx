"use client";

import { useMemo } from "react";
import { useBuilder } from "@/context/BuilderContext";

export function ThemeSelector() {
  const { selectedTemplate, theme, themeDefaults, updateTheme } = useBuilder();

  const colorDefinitions = selectedTemplate.colors;
  const colorKeys = colorDefinitions.map((color) => color.id);
  const fontKeys = selectedTemplate.fonts;

  const palettes = useMemo(() => buildPalettes(colorKeys), [colorKeys]);

  return (
    <div className="space-y-4">
      {colorKeys.length ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Palettes</p>
          <div className="space-y-2">
            {palettes.map((preset) => (
              <button
                type="button"
                key={preset.name}
                onClick={() =>
                  updateTheme({
                    colors: preset.colors,
                    name: preset.name,
                    label: preset.label ?? preset.name,
                  })
                }
                className="flex w-full items-center justify-between rounded-2xl border border-gray-800 bg-gray-900/40 px-4 py-3 text-left transition hover:border-builder-accent/40"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{preset.name}</p>
                  <p className="text-xs text-slate-500">Apply this palette</p>
                </div>
                <div className="flex items-center gap-2">
                  {Object.values(preset.colors)
                    .slice(0, 3)
                    .map((value, index) => (
                      <span key={`${preset.name}-${index}`} className="h-7 w-7 rounded-full border border-white/10" style={{ backgroundColor: value }} />
                    ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {colorKeys.length ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fine tune colors</p>
          <div className="space-y-3">
            {colorDefinitions.map((color) => {
              const key = color.id;
              const appliedValue =
                theme.colors[key] ?? themeDefaults.colors[key] ?? color.default ?? "";
              return (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
                    style={{ backgroundColor: appliedValue || "transparent" }}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {color.label ?? formatTokenLabel(key)}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={ensureColorValue(
                          theme.colors[key] ?? themeDefaults.colors[key] ?? color.default
                        )}
                        onChange={(event) => updateTheme({ colors: { [key]: event.target.value } })}
                        className="h-8 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
                      />
                      <input
                        type="text"
                        value={theme.colors[key] ?? ""}
                        placeholder={themeDefaults.colors[key] ?? color.default ?? "#000000"}
                        onChange={(event) => updateTheme({ colors: { [key]: event.target.value } })}
                        className="flex-1 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-100 focus:border-builder-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {fontKeys.length ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fonts</p>
          <div className="space-y-3">
            {fontKeys.map((key) => (
              <label key={key} className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{formatTokenLabel(key)}</span>
                <input
                  type="text"
                  value={theme.fonts[key] ?? ""}
                  placeholder={themeDefaults.fonts[key] ?? '"Inter", sans-serif'}
                  onChange={(event) => updateTheme({ fonts: { [key]: event.target.value } })}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-100 focus:border-builder-accent focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">e.g. &ldquo;Outfit&rdquo;, sans-serif</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatTokenLabel(token: string) {
  return token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function ensureColorValue(value: string | undefined) {
  return value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

const basePalettes = [
  ["#38bdf8", "#0ea5e9", "#f472b6", "#020617", "#e2e8f0"],
  ["#f59e0b", "#d97706", "#fde68a", "#0b1120", "#f8fafc"],
  ["#34d399", "#10b981", "#86efac", "#022c22", "#ecfdf5"],
];

type PaletteDefinition = {
  name: string;
  label?: string;
  colors: Record<string, string>;
};

function buildPalettes(colorKeys: string[]): PaletteDefinition[] {
  if (!colorKeys.length) {
    return [];
  }

  return basePalettes.map((paletteValues, paletteIndex) => {
    const colors: Record<string, string> = {};
    colorKeys.forEach((key, index) => {
      const value = paletteValues[index % paletteValues.length];
      colors[key] = value;
    });
    const names = ["Aurora", "Luxe", "Verdant"];
    const name = names[paletteIndex] ?? `Palette ${paletteIndex + 1}`;
    return {
      name,
      label: name,
      colors,
    } satisfies PaletteDefinition;
  });
}
