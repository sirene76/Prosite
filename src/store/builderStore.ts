import { create } from "zustand";
import lodashSet from "lodash.set";

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: { id: string; label: string }[];
  fields: { id: string; label: string; default: string }[];
  themes: Theme[];
  defaultContent?: Record<string, any>;
}

interface BuilderState {
  template: TemplateMeta | null;
  content: Record<string, any>;
  theme: Theme | null;
  setTemplate: (t: TemplateMeta) => void;
  setContent: (key: string, value: any) => void;
  setTheme: (theme: Theme) => void;
  reset: () => void;
  initialize: (params: { websiteId: string }) => Promise<void>;
}

// Utility to build nested default content
function buildDefaultContent(fields: { id: string; default: string }[]) {
  const content: Record<string, any> = {};
  for (const field of fields) {
    const parts = field.id.split(".");
    let current = content;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = field.default;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }
  return content;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  template: null,
  content: {},
  theme: null,

  // Initialize builder from API
  initialize: async ({ websiteId }) => {
    try {
      const res = await fetch(`/api/websites/${websiteId}`);
      const data = await res.json();

      if (data.template) get().setTemplate(data.template);
      if (data.theme) get().setTheme(data.theme);
      if (data.content) set({ content: data.content });
    } catch (err) {
      console.error("Failed to initialize builder:", err);
    }
  },

  // Apply template + default content/theme
  setTemplate: (t) =>
    set({
      template: { ...t, defaultContent: buildDefaultContent(t.fields) },
      content: buildDefaultContent(t.fields),
      theme: t.themes[0] || null,
    }),

  // Update nested field value

setContent: (key, value) =>
  set((state) => {
    const newContent = { ...state.content };
    lodashSet(newContent, key, value);
    return { content: newContent };
  }),

  // Update theme
  setTheme: (theme) => set({ theme }),

  // Reset everything
  reset: () => set({ template: null, content: {}, theme: null }),
}));

// Debug snapshot (safe to import in dev)
export function __debugBuilderSnapshot() {
  try {
    const s = require("./builderStore").useBuilderStore.getState();
    const sampleKeys = Object.keys(s.content || {}).slice(0, 8);
    return {
      hasTemplate: !!s.template,
      templateId: s.template?.id,
      fieldsCount: s.template?.fields?.length ?? 0,
      modulesCount: s.template?.modules?.length ?? 0,
      themeId: s.theme?.id,
      contentType: typeof s.content,
      topKeys: sampleKeys,
      contentSample: sampleKeys.reduce((acc: any, k) => {
        acc[k] = s.content[k];
        return acc;
      }, {} as Record<string, unknown>),
    };
  } catch (e) {
    return { error: String(e) };
  }
}
