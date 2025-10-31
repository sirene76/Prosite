import { create } from "zustand";

import { updateWebsite } from "@/lib/updateWebsite";

type BuilderContent = {
  title: string;
  businessName: string;
  logoUrl?: string;
};

type BuilderTemplate = {
  id?: string;
  meta?: Record<string, unknown>;
};

type BuilderState = {
  websiteId: string | null;
  template: BuilderTemplate | null;
  theme: string | null;
  content: BuilderContent;
  setWebsiteId: (websiteId: string | null) => void;
  setTemplate: (template: BuilderTemplate | null) => void;
  initialize: (payload: {
    websiteId?: string | null;
    theme?: string | null;
    content?: Partial<BuilderContent>;
    template?: BuilderTemplate | null;
  }) => void;
  setTheme: (theme: string) => void;
  updateContent: (key: string, value: string) => void;
};

const DEFAULT_CONTENT: BuilderContent = {
  title: "",
  businessName: "",
  logoUrl: undefined,
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  websiteId: null,
  template: null,
  theme: null,
  content: { ...DEFAULT_CONTENT },
  setWebsiteId: (websiteId) => set({ websiteId }),
  setTemplate: (template) => set({ template }),
  initialize: ({ websiteId, theme, content, template }) => {
    set((state) => ({
      websiteId:
        typeof websiteId !== "undefined" ? websiteId ?? null : state.websiteId,
      theme: typeof theme !== "undefined" ? theme ?? null : state.theme,
      content: typeof content !== "undefined"
        ? { ...DEFAULT_CONTENT, ...content }
        : state.content,
      template: typeof template !== "undefined" ? template ?? null : state.template,
    }));
  },
  setTheme: (themeName) => {
    set({ theme: themeName });
    const { websiteId, content } = get();
    if (websiteId) {
      void updateWebsite(websiteId, {
        theme: themeName,
        content,
      });
    }
  },
  updateContent: (key, value) => {
    set((state) => {
      const nextContent = { ...state.content, [key]: value };
      if (state.websiteId) {
        void updateWebsite(state.websiteId, {
          theme: state.theme,
          content: nextContent,
        });
      }
      return { content: nextContent };
    });
  },
}));

export type { BuilderContent, BuilderTemplate };
