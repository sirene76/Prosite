"use client";

import { useEffect } from "react";

import { applyThemeToIframe } from "@/lib/applyThemeToIframe";
import { useBuilder } from "@/context/BuilderContext";
import { useBuilderStore } from "@/store/builderStore";

export type Theme = {
  name: string;
  colors: Record<string, string>;
  fonts?: Record<string, string>;
};

export type ThemeOption = Theme;

export function ThemePanel({ themes }: { themes: Theme[] }) {
  const selectedTheme = useBuilderStore((state) => state.selectedTheme);
  const setSelectedTheme = useBuilderStore((state) => state.setSelectedTheme);
  const { updateTheme } = useBuilder();

  function applyTheme(theme: Theme) {
    const iframe = document.querySelector("iframe");
    applyThemeToIframe(iframe?.contentDocument ?? null, {
      colors: theme.colors,
      fonts: theme.fonts,
    });
  }

  function handleThemeClick(theme: Theme) {
    setSelectedTheme(theme.name);
    updateTheme({
      colors: theme.colors,
      name: theme.name,
      label: theme.name,
    });
    applyTheme(theme);
  }

  useEffect(() => {
    if (!themes?.length) {
      return;
    }

    const activeTheme = themes.find((theme) => theme.name === selectedTheme);
    if (activeTheme) {
      applyTheme(activeTheme);
      return;
    }

    setSelectedTheme(themes[0].name);
    applyTheme(themes[0]);
  }, [themes, selectedTheme, setSelectedTheme]);

  if (!themes?.length) {
    return <p className="text-gray-400 text-sm">No themes defined for this template.</p>;
  }

  return (
    <div className="space-y-3">
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => handleThemeClick(theme)}
          className={`w-full rounded-md px-4 py-2 text-sm font-medium transition theme-button ${
            selectedTheme === theme.name
              ? "bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
          }`}
          type="button"
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
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

        const fonts: Record<string, string> = {};
        const sourceFonts = (theme as { fonts?: Record<string, unknown> }).fonts;
        if (sourceFonts && typeof sourceFonts === "object") {
          Object.entries(sourceFonts).forEach(([key, value]) => {
            if (typeof value === "string" && value.trim()) {
              fonts[key] = value;
            }
          });
        }

        return {
          name: (theme as { name: string }).name,
          colors,
          fonts,
        } as ThemeOption;
      }

      return null;
    })
    .filter((theme): theme is ThemeOption => Boolean(theme));
}
