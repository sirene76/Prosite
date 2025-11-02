import { create } from "zustand";
import lodashSet from "lodash.set";

type PlainObject = Record<string, unknown>;

export type BuilderTemplate = {
  id: string;
  meta?: PlainObject;
  /**
   * When available, templates can expose a default content payload. This mirrors
   * the shape expected by the preview iframe and is merged with any overrides
   * provided during initialisation.
   */
  defaultContent?: PlainObject | null;
  /** Additional template metadata collected elsewhere in the app. */
  [key: string]: unknown;
};

export type BuilderThemeConfig = {
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
};

export type BuilderContent = PlainObject;

export type BuilderInitializeInput = {
  template?: BuilderTemplate | null;
  content?: BuilderContent | null;
  themeId?: string | null;
  themeConfig?: BuilderThemeConfig | null;
};

interface BuilderState {
  template: BuilderTemplate | null;
  content: BuilderContent;
  themeId: string | null;
  themeConfig: BuilderThemeConfig | null;
  setTemplate: (template: BuilderTemplate | null) => void;
  updateContent: (path: string, value: unknown) => void;
  setTheme: (themeId: string | null, themeConfig?: BuilderThemeConfig | null) => void;
  initialize: (input: BuilderInitializeInput) => void;
  reset: () => void;
}

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
  return merged;
};


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
    const s = useBuilderStore.getState();
    const sampleKeys = Object.keys(s.content || {}).slice(0, 8);
    return {
      hasTemplate: !!s.template,
      templateId: s.template?.id,
      themeId: s.themeId,
      contentKeys: sampleKeys,
      contentSample: sampleKeys.reduce((acc: PlainObject, key) => {
        acc[key] = s.content[key];
        return acc;
      }, {} as PlainObject),
    };
  } catch (e) {
    return { error: String(e) };
  }
}
