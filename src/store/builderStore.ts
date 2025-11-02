import { create } from "zustand";
import lodashSet from "lodash.set";

/** A simple object map used throughout the builder store. */
type PlainObject = Record<string, unknown>;

export type BuilderTemplate = {
  id: string;
  /**
   * Optional template metadata fetched from the API. We intentionally keep the
   * structure loose to avoid coupling the store to backend details.
   */
  meta?: PlainObject | null;
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
  /**
   * Replace the full content object. This is primarily used during
   * initialisation when we already have the entire payload available.
   */
  replaceContent: (nextContent: BuilderContent | null | undefined) => void;
  /**
   * Update a single nested property inside the content object using dot
   * notation (e.g. `hero.title`). Passing an empty path replaces the entire
   * content object which keeps backwards compatibility with the previous
   * implementation.
   */
  setContent: (path: string, value: unknown) => void;
  /** Alias for setContent kept for semantic clarity in some call-sites. */
  updateContent: (path: string, value: unknown) => void;
  setTheme: (themeId: string | null, themeConfig?: BuilderThemeConfig | null) => void;
  initialize: (input: BuilderInitializeInput) => void;
  reset: () => void;
}

const defaultState: Pick<BuilderState, "template" | "content" | "themeId" | "themeConfig"> = {
  template: null,
  content: {},
  themeId: null,
  themeConfig: null,
};

function cloneContent(content: BuilderContent | null | undefined): BuilderContent {
  if (!content || typeof content !== "object") return {};
  return JSON.parse(JSON.stringify(content));
}

function applyContentUpdate(current: BuilderContent, path: string, value: unknown): BuilderContent {
  if (!path) {
    return cloneContent((value as BuilderContent) ?? {});
  }

  const next = cloneContent(current);
  lodashSet(next, path, value);
  return next;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  ...defaultState,

  setTemplate: (template) =>
    set(() => ({
      template: template ? { ...template } : null,
    })),

  replaceContent: (nextContent) =>
    set(() => ({
      content: cloneContent(nextContent ?? {}),
    })),

  setContent: (path, value) =>
    set((state) => ({
      content: applyContentUpdate(state.content, path, value),
    })),

  updateContent: (path, value) =>
    set((state) => ({
      content: applyContentUpdate(state.content, path, value),
    })),

  setTheme: (themeId, themeConfig) =>
    set(() => ({
      themeId: themeId ?? null,
      themeConfig: themeConfig ?? null,
    })),

  initialize: ({ template, content, themeId, themeConfig }) =>
    set(() => ({
      template: template ? { ...template } : null,
      content: cloneContent(content ?? {}),
      themeId: themeId ?? null,
      themeConfig: themeConfig ?? null,
    })),

  reset: () => set(() => ({ ...defaultState })),
}));

// Debug snapshot (safe to import in dev environments)
export function __debugBuilderSnapshot() {
  try {
    const state = useBuilderStore.getState();
    const sampleKeys = Object.keys(state.content || {}).slice(0, 8);
    return {
      hasTemplate: !!state.template,
      templateId: state.template?.id,
      themeId: state.themeId,
      themeConfigKeys: state.themeConfig ? Object.keys(state.themeConfig) : [],
      contentKeys: sampleKeys,
      contentSample: sampleKeys.reduce<PlainObject>((acc, key) => {
        acc[key] = state.content[key];
        return acc;
      }, {}),
    };
  } catch (error) {
    return { error: String(error) };
  }
}
