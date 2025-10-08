"use client";

import { create } from "zustand";

export type BuilderDevice = "desktop" | "tablet" | "mobile";

const DEFAULT_PAGE_NAMES = ["Home", "About", "Contact"] as const;

type BuilderStoreState = {
  websiteId: string | null;
  websiteName: string;
  themeName: string;
  pages: string[];
  device: BuilderDevice;
  setWebsiteId: (websiteId: string | null | undefined) => void;
  setWebsiteName: (websiteName: string | null | undefined) => void;
  setThemeName: (themeName: string | null | undefined) => void;
  setPages: (pages: Array<string | null | undefined> | null | undefined) => void;
  setDevice: (device: BuilderDevice) => void;
};

function normalizePages(pages: Array<string | null | undefined> | null | undefined) {
  if (!Array.isArray(pages)) {
    return [...DEFAULT_PAGE_NAMES];
  }

  const normalized = pages
    .map((page) => (typeof page === "string" ? page.trim() : ""))
    .filter((page) => page.length > 0);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : [...DEFAULT_PAGE_NAMES];
}

export const useBuilderStore = create<BuilderStoreState>((set) => ({
  websiteId: null,
  websiteName: "Untitled Website",
  themeName: "Default",
  pages: [...DEFAULT_PAGE_NAMES],
  device: "desktop",
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
  setPages: (pages) => {
    set({ pages: normalizePages(pages) });
  },
  setDevice: (device) => {
    set({ device });
  },
}));

export const DEFAULT_BUILDER_PAGES = [...DEFAULT_PAGE_NAMES];
