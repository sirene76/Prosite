"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { templates, type TemplateDefinition } from "@/lib/templateDefinitions";

type Device = "desktop" | "tablet" | "mobile";

type BuilderContextValue = {
  device: Device;
  setDevice: (device: Device) => void;
  previewFrame: HTMLIFrameElement | null;
  registerPreviewFrame: (frame: HTMLIFrameElement | null) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedTemplate: TemplateDefinition;
  selectTemplate: (templateId: string) => void;
  theme: Record<string, string>;
  updateTheme: (changes: Record<string, string>) => void;
  content: Record<string, string>;
  updateContent: (changes: Record<string, string>) => void;
  openContentSection: string | null;
  setOpenContentSection: (sectionId: string | null) => void;
  scrollPreviewToSection: (sectionId: string | null) => void;
  isPreviewReady: boolean;
  updatePreviewDocument: (html: string) => void;
  openPreview: () => void;
};

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

const defaultTheme = {
  primaryColor: "#38bdf8",
  secondaryColor: "#0ea5e9",
  accentColor: "#f472b6",
  backgroundColor: "#020617",
  textColor: "#e2e8f0",
};

const defaultTemplate = templates[0];

function getTemplateContentDefaults(template: TemplateDefinition | undefined) {
  if (!template?.meta?.content) {
    return {} as Record<string, string>;
  }

  return Object.entries(template.meta.content).reduce<Record<string, string>>(
    (accumulator, [key, field]) => {
      accumulator[key] = field.default ?? "";
      return accumulator;
    },
    {}
  );
}

function getFirstSectionId(template: TemplateDefinition | undefined) {
  if (!template?.meta?.content) {
    return null;
  }

  const keys = Object.keys(template.meta.content);
  for (const key of keys) {
    const [section] = key.split(".");
    if (section) {
      return section;
    }
  }

  return null;
}

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [previewFrame, setPreviewFrame] = useState<HTMLIFrameElement | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplate?.id ?? "");
  const [theme, setTheme] = useState<Record<string, string>>(defaultTheme);
  const [content, setContent] = useState<Record<string, string>>(() =>
    getTemplateContentDefaults(defaultTemplate)
  );
  const [previewDocument, setPreviewDocument] = useState("");
  const [openContentSection, setOpenContentSectionState] = useState<string | null>(
    getFirstSectionId(defaultTemplate)
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0],
    [selectedTemplateId]
  );

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);

  const updateTheme = useCallback((changes: Record<string, string>) => {
    setTheme((prev) => ({ ...prev, ...changes }));
  }, []);

  const updateContent = useCallback((changes: Record<string, string>) => {
    setContent((prev) => ({ ...prev, ...changes }));
  }, []);

  const scrollPreviewToSection = useCallback(
    (sectionId: string | null) => {
      if (!sectionId) {
        return;
      }

      const frameWindow = previewFrame?.contentWindow;
      frameWindow?.postMessage(
        {
          type: "scroll-to",
          section: sectionId,
        },
        "*"
      );
    },
    [previewFrame]
  );

  const setOpenContentSection = useCallback(
    (sectionId: string | null) => {
      setOpenContentSectionState(sectionId);
      if (sectionId) {
        scrollPreviewToSection(sectionId);
      }
    },
    [scrollPreviewToSection]
  );

  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
  }, []);

  const registerPreviewFrame = useCallback((frame: HTMLIFrameElement | null) => {
    setPreviewFrame(frame);
  }, []);

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

  useEffect(() => {
    const template = templates.find((item) => item.id === selectedTemplateId) ?? templates[0];
    setContent(getTemplateContentDefaults(template));
    setOpenContentSectionState(getFirstSectionId(template));
  }, [selectedTemplateId]);

  useEffect(() => {
    if (openContentSection) {
      scrollPreviewToSection(openContentSection);
    }
  }, [openContentSection, scrollPreviewToSection, previewFrame]);

  const value = useMemo<BuilderContextValue>(
    () => ({
      device,
      setDevice,
      previewFrame,
      registerPreviewFrame,
      isSidebarCollapsed,
      toggleSidebar,
      selectedTemplate,
      selectTemplate,
      theme,
      updateTheme,
      content,
      updateContent,
      openContentSection,
      setOpenContentSection,
      scrollPreviewToSection,
      isPreviewReady,
      updatePreviewDocument,
      openPreview,
    }),
    [
      device,
      setDevice,
      previewFrame,
      registerPreviewFrame,
      isSidebarCollapsed,
      toggleSidebar,
      selectedTemplate,
      selectTemplate,
      theme,
      updateTheme,
      content,
      updateContent,
      openContentSection,
      setOpenContentSection,
      scrollPreviewToSection,
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
