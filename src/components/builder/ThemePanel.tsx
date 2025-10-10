"use client";

import { ThemeSelector } from "./ThemeSelector";

export type ThemeOption = {
  name: string;
  colors: Record<string, string>;
};

type ThemePanelProps = {
  themes?: unknown;
};

export function ThemePanel({ themes }: ThemePanelProps) {
  const resolvedThemes = normaliseThemeOptions(themes);

  if (resolvedThemes.length === 0) {
    return <p className="text-gray-400 text-sm">No themes defined for this template.</p>;
  }

  return <ThemeSelector themes={resolvedThemes} />;
}

export function normaliseThemeOptions(source: unknown): ThemeOption[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((theme) => {
      if (
        theme &&
        typeof theme === "object" &&
        typeof (theme as { name?: unknown }).name === "string" &&
        typeof (theme as { colors?: unknown }).colors === "object" &&
        (theme as { colors?: unknown }).colors !== null
      ) {
        const colors: Record<string, string> = {};
        Object.entries((theme as { colors: Record<string, unknown> }).colors).forEach(([key, value]) => {
          if (typeof value === "string" && value.trim()) {
            colors[key] = value;
          }
        });

        return {
          name: (theme as { name: string }).name,
          colors,
        } as ThemeOption;
      }

      return null;
    })
    .filter((theme): theme is ThemeOption => Boolean(theme));
}
