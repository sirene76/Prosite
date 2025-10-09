"use client";

import { useMemo } from "react";

import { useBuilderStore } from "@/store/builderStore";

type ThemeOption = {
  name: string;
  colors: Record<string, string>;
};

type ThemeSelectorProps = {
  themes?: ThemeOption[];
};

export function ThemeSelector({ themes }: ThemeSelectorProps) {
  const theme = useBuilderStore((state) => state.theme);
  const setTheme = useBuilderStore((state) => state.setTheme);

  const hasThemes = Array.isArray(themes) && themes.length > 0;
  const activeName = useMemo(() => {
    if (!hasThemes) return undefined;
    return themes?.find((option) => isSameTheme(option.colors, theme))?.name;
  }, [hasThemes, theme, themes]);

  if (!hasThemes) return <p className="text-sm text-slate-400">No theme variations</p>;

  return (
    <div className="flex flex-wrap gap-3">
      {themes!.map((themeOption) => {
        const isActive = activeName === themeOption.name;
        return (
          <button
            key={themeOption.name}
            onClick={() => setTheme(themeOption.colors)}
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

function isSameTheme(a: Record<string, string>, b: Record<string, unknown>) {
  const aEntries = Object.entries(a);
  if (aEntries.length === 0) {
    return false;
  }
  return aEntries.every(([key, value]) => {
    const current = typeof b[key] === "string" ? (b[key] as string) : undefined;
    return current?.toLowerCase() === value?.toLowerCase();
  });
}
