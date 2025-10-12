"use client";

import { create } from "zustand";

export type BuilderDevice = "desktop" | "tablet" | "mobile";

const DEFAULT_PAGE_NAMES = ["Home"] as const;

type BuilderStoreState = {
  websiteId: string | null;
  websiteName: string;
  themeName: string;
  selectedTheme: string | null;
  pages: string[];
  device: BuilderDevice;
  theme: Record<string, string>;
  values: Record<string, unknown>;
  setWebsiteId: (websiteId: string | null | undefined) => void;
  setWebsiteName: (websiteName: string | null | undefined) => void;
  setThemeName: (themeName: string | null | undefined) => void;
  setSelectedTheme: (themeName: string) => void;
  setPages: (pages: string[] | null | undefined) => void;
  setDevice: (device: BuilderDevice) => void;
  setTheme: (colors: Record<string, string> | null | undefined) => void;
  updateValue: (key: string, value: unknown) => void;
  resetValues: () => void;
};

export const useBuilderStore = create<BuilderStoreState>((set) => ({
  websiteId: null,
  websiteName: "Untitled Website",
  themeName: "Default",
  selectedTheme: null,
  pages: [...DEFAULT_PAGE_NAMES],
  device: "desktop",
  theme: {},
  values: {},
  setWebsiteId: (websiteId) => {
    set({ websiteId: websiteId ?? null });
  },
  setWebsiteName: (websiteName) => {
    const resolved = typeof websiteName === "string" ? websiteName.trim() : "";
    set({ websiteName: resolved.length > 0 ? resolved : "Untitled Website" });
  },
  setThemeName: (themeName) => {
    const resolved = typeof themeName === "string" ? themeName.trim() : "";
    set({ themeName: resolved.length > 0 ? resolved : "Default" });
  },
  setSelectedTheme: (themeName) => {
    set({ selectedTheme: themeName });
  },
  setPages: (pages) => {
    const nextPages = Array.isArray(pages) && pages.length > 0 ? pages : [...DEFAULT_PAGE_NAMES];
    set({ pages: nextPages });
  },
  setDevice: (device) => {
    set({ device });
  },
  setTheme: (colors) => {
    console.log("🧱 setTheme called during:", performance.now());
    console.trace("setTheme stack trace");
    set({ theme: colors ?? {} });
  },
  updateValue: (key, value) => {
    if (typeof key !== "string" || !key.trim()) {
      return;
    }
    set((state) => ({ values: { ...state.values, [key]: value } }));
  },
  resetValues: () => {
    set({ values: {} });
  },
}));

export const DEFAULT_BUILDER_PAGES = [...DEFAULT_PAGE_NAMES];
