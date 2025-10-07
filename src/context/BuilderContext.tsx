"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import type { TemplateDefinition } from "@/lib/templates";

type Device = "desktop" | "tablet" | "mobile";

export type ThemeState = {
  name?: string;
  label?: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
};

export type TemplateContentField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "image" | "color";
  placeholder?: string;
  description?: string;
  defaultValue?: string;
};

export type TemplateContentSection = {
  id: string;
  label: string;
  description?: string;
  fields: TemplateContentField[];
};

import {
  BUILDER_STEPS,
  type BuilderStep,
  buildBuilderStepPath,
  getActiveBuilderStep,
  resolveBuilderBasePath,
} from "@/lib/builderSteps";

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
  content: Record<string, unknown>;
  updateContent: (changes: Record<string, unknown>) => void;
  contentSections: TemplateContentSection[];
  registerContentPlaceholders: (placeholders: string[]) => void;
  isPreviewReady: boolean;
  updatePreviewDocument: (html: string) => void;
  openPreview: () => void;
  steps: readonly BuilderStep[];
  currentStep: number;
  currentStepKey: BuilderStep;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  builderBasePath: string;
  websiteId?: string;
  setWebsiteId: (websiteId: string | undefined) => void;
  saveWebsiteChanges: (websiteId: string, updates: Record<string, unknown>) => Promise<unknown | undefined>;
};

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

function createInitialTheme(template: TemplateDefinition | undefined): ThemeState {
  const colorEntries = (template?.colors ?? []).map((color) => [color.id, color.default ?? ""] as const);
  const fontEntries = (template?.fonts ?? []).map((font) => [font, ""] as const);
  return {
    name: "Default",
    label: "Default",
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
): { sections: TemplateContentSection[]; keys: string[]; defaults: Record<string, string> } {
  const seenKeys = new Set<string>();
  const defaults: Record<string, string> = {};

  const sectionMap = new Map<string, TemplateContentSection>();
  const templateSections = template?.sections ?? [];

  templateSections.forEach((section) => {
    // ✅ Make sure we always return a TemplateContentField or null
    const fields: TemplateContentField[] = section.fields
      .map((field): TemplateContentField | null => {
        const key = field.id.trim();
        if (!key) return null;

        seenKeys.add(key);

        if (typeof field.default === "string") {
          defaults[key] = field.default;
        }

        return {
          key,
          label: field.label ?? toSentence(key.split(".").pop() ?? key),
          type: mapFieldType(field.type, key),
          placeholder: field.placeholder ?? undefined,
          description: field.description ?? undefined,
          defaultValue: field.default ?? undefined,
        };
      })
      // ✅ Proper type predicate so TS narrows nulls
      .filter((field): field is TemplateContentField => field !== null);

    sectionMap.set(section.id, {
      id: section.id,
      label: section.label ?? toSentence(section.id),
      description: section.description,
      fields,
    });
  });

  // ✅ Add missing placeholders that aren't explicitly declared
  placeholders.forEach((placeholder) => {
    const trimmed = placeholder.trim();
    if (!trimmed || seenKeys.has(trimmed) || trimmed.startsWith("modules.")) {
      return;
    }

    seenKeys.add(trimmed);

    const [rawSection, ...fieldParts] = trimmed.split(".");
    const hasSection = fieldParts.length > 0;
    const sectionId = hasSection ? toSlug(rawSection) : "general";
    const fieldKey = hasSection ? fieldParts.join(".") : rawSection;

    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        id: sectionId,
        label: hasSection ? toSentence(rawSection) : "General",
        fields: [],
      });
    }

    const section = sectionMap.get(sectionId);
    if (!section) return;

    section.fields.push({
      key: trimmed,
      label: toSentence(fieldKey),
      type: inferFieldType(fieldKey),
      placeholder: undefined,
      description: undefined,
      defaultValue: undefined,
    });
  });

  // ✅ Sort sections and deduplicate field keys
  const sections = Array.from(sectionMap.values()).filter(
    (section) => section.fields.length > 0
  );

  if (templateSections.length) {
    const order = new Map(templateSections.map((section, index) => [section.id, index] as const));
    sections.sort((a, b) => {
      const aIndex = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex === bIndex) return a.label.localeCompare(b.label);
      return aIndex - bIndex;
    });
  } else {
    sections.sort((a, b) => a.label.localeCompare(b.label));
  }

  sections.forEach((section) => {
    section.fields = section.fields.filter(
      (field, index, array) => array.findIndex((item) => item.key === field.key) === index
    );
  });

  return {
    sections,
    keys: Array.from(seenKeys),
    defaults,
  };
}


function mapFieldType(fieldType: TemplateContentField["type"] | string | undefined, key: string) {
  if (fieldType === "textarea" || fieldType === "image" || fieldType === "color") {
    return fieldType;
  }
  if (fieldType === "email") {
    return "email";
  }
  return inferFieldType(key);
}

function createDefaultContent(placeholders: string[], defaults: Record<string, string>) {
  const result: Record<string, unknown> = {};
  placeholders.forEach((placeholder) => {
    const key = placeholder.trim();
    if (!key) {
      return;
    }
    if (typeof defaults[key] === "string") {
      result[key] = defaults[key];
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
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [contentSections, setContentSections] = useState<TemplateContentSection[]>([]);
  const [previewDocument, setPreviewDocument] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [websiteIdState, setWebsiteIdState] = useState<string | undefined>();
  const websiteId = websiteIdState;

  const saveWebsiteChanges = useCallback(
    async (targetWebsiteId: string, updates: Record<string, unknown>) => {
      try {
        if (!targetWebsiteId) {
          return undefined;
        }

        const res = await fetch(`/api/websites/${targetWebsiteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          throw new Error(`Failed to save website changes: ${res.status}`);
        }

        return await res.json();
      } catch (err) {
        console.error("Save error:", err);
        return undefined;
      }
    },
    []
  );

  const fallbackTemplate = useMemo<TemplateDefinition>(
    () =>
      templates[0] ?? {
        id: "__fallback__",
        name: "No templates available",
        description: "Add template folders under /templates to get started.",
        previewImage: "",
        previewVideo: undefined,
        path: "",
        sections: [],
        colors: [],
        fonts: [],
        modules: [],
      },
    [templates]
  );

  const lastSyncedTemplateRef = useRef<{ websiteId?: string; templateId?: string }>({
    websiteId: websiteIdState,
    templateId: templates[0]?.id,
  });

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? fallbackTemplate,
    [fallbackTemplate, selectedTemplateId, templates]
  );
  const selectedTemplateIdRef = selectedTemplate.id;

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);

  const updateTheme = useCallback(
    (changes: Partial<ThemeState>) => {
      setTheme((prev) => {
        const nextColors = changes.colors ? { ...prev.colors, ...changes.colors } : prev.colors;
        const nextFonts = changes.fonts ? { ...prev.fonts, ...changes.fonts } : prev.fonts;

        const hasColorChanges = Boolean(changes.colors && Object.keys(changes.colors).length > 0);
        const hasFontChanges = Boolean(changes.fonts && Object.keys(changes.fonts).length > 0);
        const hasTokenChanges = hasColorChanges || hasFontChanges;

        const nameProvided = Object.prototype.hasOwnProperty.call(changes, "name");
        const labelProvided = Object.prototype.hasOwnProperty.call(changes, "label");

        let nextName = nameProvided ? changes.name : prev.name;
        let nextLabel = labelProvided ? changes.label : prev.label;

        if (!labelProvided && nameProvided) {
          nextLabel = changes.name;
        }

        if (hasTokenChanges && !nameProvided && !labelProvided) {
          nextName = "Custom";
          nextLabel = "Custom";
        }

        const next: ThemeState = {
          colors: nextColors,
          fonts: nextFonts,
          name: nextName,
          label: nextLabel,
        };

        if (websiteId) {
          void saveWebsiteChanges(websiteId, { theme: next });
        }

        return next;
      });
    },
    [saveWebsiteChanges, websiteId]
  );

  const registerThemeDefaults = useCallback((defaults: Partial<ThemeState>) => {
    setThemeDefaults((prev) => ({
      ...prev,
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
        ...prev,
        colors: nextColors,
        fonts: nextFonts,
      };
    });
  }, []);

  const updateContent = useCallback(
    (changes: Record<string, unknown>) => {
      setContent((prev) => {
        const next = { ...prev, ...changes };

        if (websiteId) {
          void saveWebsiteChanges(websiteId, { content: next });
        }

        return next;
      });
    },
    [saveWebsiteChanges, websiteId]
  );

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
      const { sections, keys, defaults } = buildContentSections(placeholders, selectedTemplate);
      setContentSections(sections);

      setContent((prev) => {
        const fallback = createDefaultContent(keys, defaults);
        const next: Record<string, unknown> = { ...prev };
        keys.forEach((key) => {
          if (prev[key] !== undefined) {
            next[key] = prev[key];
            return;
          }
          if (Object.prototype.hasOwnProperty.call(fallback, key)) {
            next[key] = fallback[key];
            return;
          }
          next[key] = "";
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

  const router = useRouter();
  const pathname = usePathname();
  const { basePath: resolvedBasePath, websiteId: resolvedWebsiteId } = useMemo(
    () => resolveBuilderBasePath(pathname),
    [pathname]
  );

  const setWebsiteId = useCallback((nextWebsiteId: string | undefined) => {
    console.log("DEBUG BuilderContext → setWebsiteId:", nextWebsiteId);
    setWebsiteIdState((previous) => {
      if (previous === nextWebsiteId) {
        return previous;
      }
      return nextWebsiteId;
    });
  }, []);

  useEffect(() => {
    lastSyncedTemplateRef.current = {
      websiteId,
      templateId: selectedTemplateId,
    };
  }, [selectedTemplateId, websiteId]);

  useEffect(() => {
    if (resolvedWebsiteId && resolvedWebsiteId !== websiteId) {
      setWebsiteId(resolvedWebsiteId);
    }
  }, [resolvedWebsiteId, setWebsiteId, websiteId]);

  useEffect(() => {
    if (!websiteId) {
      return;
    }

    const controller = new AbortController();

    const synchronizeTemplate = async () => {
      try {
        const response = await fetch(`/api/websites/${websiteId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          console.error(
            `Failed to load website data for template sync: ${response.status}`
          );
          return;
        }

        const data = await response.json();
        const templateId: string | undefined = data?.templateId ?? data?.template?.id;

        if (!templateId) {
          return;
        }

        const lastSynced = lastSyncedTemplateRef.current;
        if (
          templateId === selectedTemplateId ||
          (lastSynced.websiteId === websiteId && lastSynced.templateId === templateId)
        ) {
          lastSyncedTemplateRef.current = { websiteId, templateId };
          return;
        }

        lastSyncedTemplateRef.current = { websiteId, templateId };
        selectTemplate(templateId);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to synchronize template with website:", error);
      }
    };

    void synchronizeTemplate();

    return () => {
      controller.abort();
    };
  }, [selectTemplate, selectedTemplateId, websiteId]);

  const builderBasePath = useMemo(() => {
    if (websiteId) {
      return `/builder/${websiteId}`;
    }
    return resolvedBasePath;
  }, [resolvedBasePath, websiteId]);

  const navigationTargetRef = useRef<
    | {
        stepKey: BuilderStep;
        targetBasePath: string;
      }
    | null
  >(null);

  const getStepNavigationTarget = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), BUILDER_STEPS.length - 1);
      const stepKey = BUILDER_STEPS[clamped];
      const targetBasePath =
        stepKey === "checkout" && !websiteId
          ? `/builder/${selectedTemplateIdRef}`
          : builderBasePath;

      return { clamped, stepKey, targetBasePath };
    },
    [builderBasePath, selectedTemplateIdRef, websiteId]
  );

  const goToStep = useCallback(
    (index: number) => {
      const { clamped, stepKey, targetBasePath } = getStepNavigationTarget(index);

      if (clamped === currentStep) {
        navigationTargetRef.current = null;
        return;
      }

      navigationTargetRef.current = { stepKey, targetBasePath };
      setCurrentStep(clamped);
    },
    [currentStep, getStepNavigationTarget]
  );

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  useEffect(() => {
    const pendingNavigation = navigationTargetRef.current;
    if (!pendingNavigation) {
      return;
    }

    navigationTargetRef.current = null;
    router.push(buildBuilderStepPath(pendingNavigation.targetBasePath, pendingNavigation.stepKey));
  }, [currentStep, router]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const activeStep = getActiveBuilderStep(pathname);
    if (activeStep) {
      const index = BUILDER_STEPS.indexOf(activeStep);
      if (index >= 0) {
        setCurrentStep(index);
      }
      return;
    }

    setCurrentStep(0);
  }, [pathname]);

  const currentStepKey = BUILDER_STEPS[currentStep] ?? BUILDER_STEPS[0];

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
      steps: BUILDER_STEPS,
      currentStep,
      currentStepKey,
      goToStep,
      nextStep,
      prevStep,
      builderBasePath,
      websiteId,
      setWebsiteId,
      saveWebsiteChanges,
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
      currentStep,
      currentStepKey,
      goToStep,
      nextStep,
      prevStep,
      builderBasePath,
      websiteId,
      setWebsiteId,
      saveWebsiteChanges,
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
