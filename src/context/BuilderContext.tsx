"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { templates, type TemplateDefinition } from "@/lib/templateDefinitions";

type Device = "desktop" | "tablet" | "mobile";

type BuilderContextValue = {
  device: Device;
  setDevice: (device: Device) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedTemplate: TemplateDefinition;
  selectTemplate: (templateId: string) => void;
  theme: Record<string, string>;
  updateTheme: (changes: Record<string, string>) => void;
  content: Record<string, string>;
  updateContent: (changes: Record<string, string>) => void;
};

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

const defaultTheme = {
  primaryColor: "#38bdf8",
  secondaryColor: "#0ea5e9",
  accentColor: "#f472b6",
  backgroundColor: "#020617",
  textColor: "#e2e8f0"
};

const defaultContent = {
  name: "Avery Johnson",
  tagline: "Product Designer & Art Director",
  about:
    "I craft immersive digital experiences and lead cross-functional teams to deliver design systems that scale.",
  resumeTitle: "Experience",
  resumeSummary: "Previously at Pixelwave Studio, Dataloom, and Nova Labs.",
  portfolioHeading: "Selected Work",
  testimonialQuote: "Working with Avery elevated our brand presence tenfold.",
  testimonialAuthor: "Jordan Smith, CEO at Nova Labs",
  contactHeadline: "Let’s build something iconic.",
  contactEmail: "hello@averyjohnson.design"
};

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [theme, setTheme] = useState<Record<string, string>>(defaultTheme);
  const [content, setContent] = useState<Record<string, string>>(defaultContent);

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

  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
  }, []);

  const value = useMemo<BuilderContextValue>(
    () => ({
      device,
      setDevice,
      isSidebarCollapsed,
      toggleSidebar,
      selectedTemplate,
      selectTemplate,
      theme,
      updateTheme,
      content,
      updateContent
    }),
    [content, device, isSidebarCollapsed, selectTemplate, selectedTemplate, theme, toggleSidebar]
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
