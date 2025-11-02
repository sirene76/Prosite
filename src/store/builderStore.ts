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

const INITIAL_STATE: Pick<BuilderState, "template" | "content" | "themeId" | "themeConfig"> = {
  template: null,
  content: {},
  themeId: null,
  themeConfig: null,
};

const structuredCloneOrFallback = <T extends PlainObject>(value: T): T => {
  if (!value || typeof value !== "object") {
    return {} as T;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const toContentRecord = (value: unknown): BuilderContent => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as BuilderContent;
};

type FlattenedEntry = { path: string; value: unknown };

const flattenContent = (value: unknown, prefix = ""): FlattenedEntry[] => {
  if (!value || typeof value !== "object") {
    return [];
  }

  const entries: FlattenedEntry[] = [];
  for (const [key, child] of Object.entries(value as PlainObject)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!path) continue;

    if (Array.isArray(child)) {
      entries.push({ path, value: child.slice() });
      continue;
    }

    if (child && typeof child === "object") {
      entries.push(...flattenContent(child, path));
      continue;
    }

    entries.push({ path, value: child });
  }
  return entries;
};

const mergeContent = (
  defaults: BuilderContent,
  overrides: BuilderContent | null | undefined,
): BuilderContent => {
  if (!overrides || typeof overrides !== "object") {
    return structuredCloneOrFallback(defaults);
  }

  const merged = structuredCloneOrFallback(defaults);
  for (const { path, value } of flattenContent(overrides)) {
    lodashSet(merged, path, value);
  }
  return merged;
};

export const useBuilderStore = create<BuilderState>((set) => ({
  ...INITIAL_STATE,

  setTemplate: (template) =>
    set(() => {
      if (!template) {
        return { ...INITIAL_STATE };
      }

      const defaultContent = toContentRecord(template.defaultContent);
      return {
        template,
        content: structuredCloneOrFallback(defaultContent),
        themeId: null,
        themeConfig: null,
      };
    }),

  updateContent: (path, value) =>
    set((state) => {
      const nextContent = structuredCloneOrFallback(state.content);
      lodashSet(nextContent, path, value);
      return { content: nextContent };
    }),

  setTheme: (themeId, themeConfig = null) => set({ themeId, themeConfig }),

  initialize: ({ template, content, themeId, themeConfig }) =>
    set(() => {
      const nextTemplate = template ?? null;
      const defaults = nextTemplate ? toContentRecord(nextTemplate.defaultContent) : {};
      return {
        template: nextTemplate,
        content: mergeContent(defaults, content ?? null),
        themeId: themeId ?? null,
        themeConfig: themeConfig ?? null,
      };
    }),

  reset: () => set({ ...INITIAL_STATE }),
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
