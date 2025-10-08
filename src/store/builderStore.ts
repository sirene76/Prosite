"use client";

import { create } from "zustand";

export type BuilderDevice = "desktop" | "tablet" | "mobile";

const DEFAULT_PAGE_NAMES = ["Home"] as const;

type BuilderStoreState = {
  websiteId: string | null;
  websiteName: string;
  themeName: string;
  pages: string[];
  device: BuilderDevice;
  setWebsiteId: (websiteId: string | null | undefined) => void;
  setWebsiteName: (websiteName: string | null | undefined) => void;
  setThemeName: (themeName: string | null | undefined) => void;
  setPages: (pages: string[] | null | undefined) => void;
  setDevice: (device: BuilderDevice) => void;
};

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
    const nextPages = Array.isArray(pages) && pages.length > 0 ? pages : [...DEFAULT_PAGE_NAMES];
    set({ pages: nextPages });
  },
  setDevice: (device) => {
    set({ device });
  },
}));

export const DEFAULT_BUILDER_PAGES = [...DEFAULT_PAGE_NAMES];
