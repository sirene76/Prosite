"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { TemplateDefinition } from "@/lib/templates";

type Device = "desktop" | "tablet" | "mobile";

type ThemeState = {
  colors: Record<string, string>;
  fonts: Record<string, string>;
};

export type TemplateContentField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "email";
};

export type TemplateContentSection = {
  id: string;
  label: string;
  fields: TemplateContentField[];
};

type BuilderContextValue = {
  templates: TemplateDefinition[];
  device: Device;
  setDevice: (device: Device) => void;
  previewFrame: HTMLIFrameElement | null;
  registerPreviewFrame: (frame: HTMLIFrameElement | null) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedTemplate: TemplateDefinition;
  selectTemplate: (templateId: string) => void;
  theme: ThemeState;
  themeDefaults: ThemeState;
  updateTheme: (changes: Partial<ThemeState>) => void;
  registerThemeDefaults: (defaults: Partial<ThemeState>) => void;
  content: Record<string, string>;
  updateContent: (changes: Record<string, string>) => void;
  contentSections: TemplateContentSection[];
  registerContentPlaceholders: (placeholders: string[]) => void;
  isPreviewReady: boolean;
  updatePreviewDocument: (html: string) => void;
  openPreview: () => void;
};

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

function createInitialTheme(template: TemplateDefinition | undefined): ThemeState {
  const colorEntries = (template?.colors ?? []).map((color) => [color, ""] as const);
  const fontEntries = (template?.fonts ?? []).map((font) => [font, ""] as const);
  return {
    colors: Object.fromEntries(colorEntries),
    fonts: Object.fromEntries(fontEntries),
  };
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSentence(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function inferFieldType(key: string): "text" | "textarea" | "email" {
  if (/email/i.test(key)) {
    return "email";
  }
  if (/(description|summary|body|about|bio|details|quote)/i.test(key)) {
    return "textarea";
  }
  return "text";
}

function buildContentSections(
  placeholders: string[],
  template: TemplateDefinition | undefined
): { sections: TemplateContentSection[]; keys: string[] } {
  const sectionOrder = (template?.sections ?? []).map((section) => ({
    id: toSlug(section) || section.toLowerCase(),
    label: section,
  }));

  const sectionsMap = new Map<string, TemplateContentSection>();
  sectionOrder.forEach((section) => {
    sectionsMap.set(section.id, { id: section.id, label: section.label, fields: [] });
  });

  const ensureSection = (sectionId: string, sectionLabel?: string) => {
    const existing = sectionsMap.get(sectionId);
    if (existing) {
      return existing;
    }

    const label = sectionLabel ?? toSentence(sectionId);
    const section: TemplateContentSection = { id: sectionId, label, fields: [] };
    sectionsMap.set(sectionId, section);
    return section;
  };

  const seenKeys = new Set<string>();

  placeholders.forEach((placeholder) => {
    const trimmed = placeholder.trim();
    if (!trimmed || seenKeys.has(trimmed)) {
      return;
    }

    seenKeys.add(trimmed);

    const [rawSection, ...fieldParts] = trimmed.split(".");
    const hasSection = fieldParts.length > 0;
    const sectionId = hasSection ? toSlug(rawSection) : "general";
    const fieldKey = hasSection ? fieldParts.join(".") : rawSection;
    const section = ensureSection(sectionId, hasSection ? rawSection : "General");

    section.fields.push({
      key: trimmed,
      label: toSentence(fieldKey),
      type: inferFieldType(fieldKey),
    });
  });

  const orderedSections: TemplateContentSection[] = [];
  sectionOrder.forEach((section) => {
    const match = sectionsMap.get(section.id);
    if (match && match.fields.length > 0) {
      orderedSections.push(match);
      sectionsMap.delete(section.id);
    }
  });

  const remaining = Array.from(sectionsMap.values())
    .filter((section) => !sectionOrder.some((item) => item.id === section.id) && section.fields.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    sections: [...orderedSections, ...remaining],
    keys: Array.from(seenKeys),
  };
}

function createDefaultContent(placeholders: string[]) {
  const result: Record<string, string> = {};
  placeholders.forEach((placeholder) => {
    const key = placeholder.trim();
    if (!key) {
      return;
    }
    const label = key.split(".").pop() ?? key;
    result[key] = toSentence(label);
  });
  return result;
}

type BuilderProviderProps = {
  children: React.ReactNode;
  templates: TemplateDefinition[];
};

export function BuilderProvider({ children, templates }: BuilderProviderProps) {
  const [device, setDevice] = useState<Device>("desktop");
  const [previewFrame, setPreviewFrame] = useState<HTMLIFrameElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [theme, setTheme] = useState<ThemeState>(() => createInitialTheme(templates[0]));
  const [themeDefaults, setThemeDefaults] = useState<ThemeState>(() => createInitialTheme(templates[0]));
  const [content, setContent] = useState<Record<string, string>>({});
  const [contentSections, setContentSections] = useState<TemplateContentSection[]>([]);
  const [previewDocument, setPreviewDocument] = useState("");

  const fallbackTemplate = useMemo<TemplateDefinition>(
    () =>
      templates[0] ?? {
        id: "__fallback__",
        name: "No templates available",
        description: "Add template folders under /templates to get started.",
        previewImage: "",
        path: "",
        sections: [],
        colors: [],
        fonts: [],
      },
    [templates]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? fallbackTemplate,
    [fallbackTemplate, selectedTemplateId, templates]
  );

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);

  const updateTheme = useCallback((changes: Partial<ThemeState>) => {
    setTheme((prev) => ({
      colors: { ...prev.colors, ...(changes.colors ?? {}) },
      fonts: { ...prev.fonts, ...(changes.fonts ?? {}) },
    }));
  }, []);

  const registerThemeDefaults = useCallback((defaults: Partial<ThemeState>) => {
    setThemeDefaults((prev) => ({
      colors: { ...prev.colors, ...(defaults.colors ?? {}) },
      fonts: { ...prev.fonts, ...(defaults.fonts ?? {}) },
    }));

    setTheme((prev) => {
      const nextColors = { ...prev.colors };
      Object.entries(defaults.colors ?? {}).forEach(([key, value]) => {
        if (!nextColors[key]) {
          nextColors[key] = value;
        }
      });

      const nextFonts = { ...prev.fonts };
      Object.entries(defaults.fonts ?? {}).forEach(([key, value]) => {
        if (!nextFonts[key]) {
          nextFonts[key] = value;
        }
      });

      return {
        colors: nextColors,
        fonts: nextFonts,
      };
    });
  }, []);

  const updateContent = useCallback((changes: Record<string, string>) => {
    setContent((prev) => ({ ...prev, ...changes }));
  }, []);

  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const nextTemplate = templates.find((template) => template.id === templateId);
    setTheme(createInitialTheme(nextTemplate));
    setThemeDefaults(createInitialTheme(nextTemplate));
    setContent({});
    setContentSections([]);
  }, [templates]);

  const registerPreviewFrame = useCallback((frame: HTMLIFrameElement | null) => {
    setPreviewFrame(frame);
  }, []);

  const registerContentPlaceholders = useCallback(
    (placeholders: string[]) => {
      const { sections, keys } = buildContentSections(placeholders, selectedTemplate);
      setContentSections(sections);

      setContent((prev) => {
        const defaults = createDefaultContent(keys);
        const next: Record<string, string> = {};
        keys.forEach((key) => {
          next[key] = prev[key] ?? defaults[key] ?? "";
        });
        return next;
      });
    },
    [selectedTemplate]
  );

  const updatePreviewDocument = useCallback((html: string) => {
    setPreviewDocument(html);
  }, []);

  const openPreview = useCallback(() => {
    if (!previewDocument || typeof window === "undefined") {
      return;
    }

    const blob = new Blob([previewDocument], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank");
    if (previewWindow) {
      previewWindow.focus();
    }
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }, [previewDocument]);

  const isPreviewReady = Boolean(previewDocument);

  const value = useMemo<BuilderContextValue>(
    () => ({
      templates,
      device,
      setDevice,
      previewFrame,
      registerPreviewFrame,
      isSidebarCollapsed,
      toggleSidebar,
      selectedTemplate,
      selectTemplate,
      theme,
      themeDefaults,
      updateTheme,
      registerThemeDefaults,
      content,
      updateContent,
      contentSections,
      registerContentPlaceholders,
      isPreviewReady,
      updatePreviewDocument,
      openPreview,
    }),
    [
      templates,
      device,
      setDevice,
      previewFrame,
      registerPreviewFrame,
      isSidebarCollapsed,
      toggleSidebar,
      selectedTemplate,
      selectTemplate,
      theme,
      themeDefaults,
      updateTheme,
      registerThemeDefaults,
      content,
      updateContent,
      contentSections,
      registerContentPlaceholders,
      isPreviewReady,
      updatePreviewDocument,
      openPreview,
    ]
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
}
