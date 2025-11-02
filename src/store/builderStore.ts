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
initialize: (params: {
  websiteId: string;
  templateId?: string;
  content?: Record<string, any>;
  theme?: any;
}) => Promise<void>;
}

// Utility to build nested default content
function buildDefaultContent(fields: { id: string; default: string }[]) {
  const content: Record<string, any> = {};
  for (const field of fields) {
    const path = field.id.split(".");
    let current = content;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (i === path.length - 1) {
        current[key] = field.default;
      } else {
        current[key] = current[key] || {};
        current = current[key];
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
initialize: async ({
  websiteId,
  templateId,
  content,
  theme,
}: {
  websiteId: string;
  templateId?: string;
  content?: Record<string, any>;
  theme?: any;
}) => {
  try {
    console.log("✅ Builder initialized", { templateId, contentKeys: Object.keys(content || {}) });

    // Optional: If you want to load from API when content is missing
    if (!content) {
      const res = await fetch(`/api/websites/${websiteId}`);
      const data = await res.json();
      if (data.template) useBuilderStore.getState().setTemplate(data.template);
      if (data.theme) useBuilderStore.getState().setTheme(data.theme);
      if (data.content) useBuilderStore.getState().setContent("", data.content);
    } else {
      // Otherwise just set what's passed in
      if (theme) useBuilderStore.getState().setTheme(theme);
      if (content) useBuilderStore.getState().setContent("", content);
    }
  } catch (err) {
    console.error("Failed to initialize builder:", err);
  }
},



  // Apply template + default content/theme
setTemplate: (t) =>
  set(() => ({
    template: { ...t, defaultContent: buildDefaultContent(t.fields) },
    content: buildDefaultContent(t.fields), // ✅ nested default structure
    theme: t.themes[0] || null,
  })),


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
