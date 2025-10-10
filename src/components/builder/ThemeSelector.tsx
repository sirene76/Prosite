"use client";

import { useMemo } from "react";
import { useBuilder } from "@/context/BuilderContext";
import { useBuilderStore } from "@/store/builderStore";


interface ThemeOption {
  name: string;
  colors: Record<string, string>;
}

interface ThemeSelectorProps {
  themes: ThemeOption[];
}

export function ThemeSelector({ themes }: ThemeSelectorProps) {
  const { updateTheme } = useBuilder(); // ✅ use context updater
  const theme = useBuilderStore((state) => state.theme);

  const hasThemes = Array.isArray(themes) && themes.length > 0;
  const activeName = useMemo(() => {
    if (!hasThemes) return undefined;
    return themes.find((option) => isSameTheme(option.colors, theme.colors))?.name;
  }, [hasThemes, theme, themes]);

  if (!hasThemes)
    return <p className="text-sm text-slate-400">No theme variations</p>;

  return (
    <div className="flex flex-wrap gap-3">
      {themes.map((themeOption) => {
        const isActive = activeName === themeOption.name;
        return (
          <button
            key={themeOption.name}
            onClick={() =>
              updateTheme({
                colors: themeOption.colors,
                name: themeOption.name,
                label: themeOption.name,
              })
            }
            className={`px-3 py-2 rounded-lg border transition text-sm ${
              isActive
                ? "border-builder-accent/60 bg-builder-accent/10 text-builder-accent"
                : "border-gray-800/70 bg-gray-900/60 text-slate-200 hover:bg-gray-900"
            }`}
            type="button"
          >
            {themeOption.name}
          </button>
        );
      })}
    </div>
  );
}

function isSameTheme(
  a: Record<string, string> = {},
  b: Record<string, string> = {}
) {
  const aEntries = Object.entries(a);
  if (aEntries.length === 0) return false;
  return aEntries.every(([key, val]) => {
    const current = b?.[key];
    return current && current.toLowerCase() === val.toLowerCase();
  });
}
