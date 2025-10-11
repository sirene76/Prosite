"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import type { TemplateDefinition } from "@/lib/templates";
import {
  DEFAULT_BUILDER_PAGES,
  useBuilderStore,
  type BuilderDevice,
} from "@/store/builderStore";

type Device = BuilderDevice;

export type ThemeState = {
  name?: string;
  label?: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
};

export type TemplateContentField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "image" | "gallery" | "color";
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
  previewDocument: string;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedTemplate: TemplateDefinition;
  selectTemplate: (templateId: string) => void;
  theme: ThemeState;
  themeDefaults: ThemeState;
  updateTheme: (changes: Partial<ThemeState>) => void;
  registerThemeDefaults: (defaults: Partial<ThemeState>) => void;
  content: Record<string, unknown>;
  updateContent: (key: string, value: unknown) => void;
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
  if (
    fieldType === "textarea" ||
    fieldType === "image" ||
    fieldType === "gallery" ||
    fieldType === "color"
  ) {
    return fieldType;
  }
  if (fieldType === "email") {
    return "email";
  }
  return inferFieldType(key);
}

function createDefaultContent(
  placeholders: string[],
  defaults: Record<string, string>,
  metaSources: Array<Record<string, unknown>> = []
) {
  const result: Record<string, unknown> = {};
  placeholders.forEach((placeholder) => {
    const key = placeholder.trim();
    if (!key) {
      return;
    }
    for (const source of metaSources) {
      const metaValue = getValueAtPath(source, key);
      if (metaValue !== undefined) {
        result[key] = cloneValue(metaValue);
        return;
      }
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

function cloneValue<T>(value: T): T {
  return toPlainValue(value) as T;
}

function toPlainValue(value: unknown): unknown {
  if (value instanceof Map) {
    return toPlainValue(Object.fromEntries(value));
  }
  if (Array.isArray(value)) {
    return value.map((item) => toPlainValue(item));
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, entry]) => [key, toPlainValue(entry)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValueAtPath(source: Record<string, unknown>, path: string): unknown {
  if (!path) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(source, path)) {
    return source[path];
  }

  const segments = path.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isFinite(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      if (!Object.prototype.hasOwnProperty.call(current, segment)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

function extractMetaContentSources(meta: unknown): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];
  const base = normaliseRecord(meta);
  if (!base) {
    return result;
  }

  const contentRecord = normaliseRecord(base["content"]);
  if (contentRecord) {
    result.push(contentRecord);
  }

  const placeholderRecord = normaliseRecord(base["placeholders"]);
  if (placeholderRecord) {
    result.push(placeholderRecord);
  }

  if (!result.length) {
    result.push(base);
  }

  return result;
}

function normaliseRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normaliseRecord(parsed);
    } catch {
      return null;
    }
  }

  if (value instanceof Map) {
    return normaliseRecord(Object.fromEntries(value));
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const entries = Object.entries(value).map(([key, entry]) => [key, toPlainValue(entry)] as const);
  return Object.fromEntries(entries);
}

function flattenContentRecord(record: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  Object.entries(record).forEach(([key, entry]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(entry)) {
      Object.assign(result, flattenContentRecord(entry, nextKey));
      return;
    }

    result[nextKey] = entry;
  });

  return result;
}

function flattenContentSources(sources: Array<Record<string, unknown>>): Record<string, unknown> {
  return sources.reduce<Record<string, unknown>>((accumulator, source) => {
    return { ...accumulator, ...flattenContentRecord(source) };
  }, {});
}

function normaliseWebsiteContent(content: unknown): Record<string, unknown> | null {
  const record = normaliseRecord(content);
  if (!record) {
    return null;
  }

  return flattenContentRecord(record);
}

function normaliseWebsiteTheme(theme: unknown): {
  name?: string;
  label?: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
} | null {
  const record = normaliseRecord(theme);
  if (!record) {
    return null;
  }

  const colors = toStringRecord(normaliseRecord(record["colors"]));
  const fonts = toStringRecord(normaliseRecord(record["fonts"]));

  return {
    name: typeof record["name"] === "string" ? record["name"] : undefined,
    label: typeof record["label"] === "string" ? record["label"] : undefined,
    colors,
    fonts,
  };
}

function toStringRecord(record: Record<string, unknown> | null): Record<string, string> {
  if (!record) {
    return {};
  }

  const result: Record<string, string> = {};
  Object.entries(record).forEach(([key, value]) => {
    if (typeof value === "string") {
      result[key] = value;
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      result[key] = String(value);
    }
  });
  return result;
}

type BuilderProviderProps = {
  children: React.ReactNode;
  templates: TemplateDefinition[];
};

export function BuilderProvider({ children, templates }: BuilderProviderProps) {
  const device = useBuilderStore((state) => state.device);
  const setDevice = useBuilderStore((state) => state.setDevice);
  const setStorePages = useBuilderStore((state) => state.setPages);
  const setStoreWebsiteName = useBuilderStore((state) => state.setWebsiteName);
  const setStoreThemeName = useBuilderStore((state) => state.setThemeName);
  const setStoreWebsiteId = useBuilderStore((state) => state.setWebsiteId);
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
        sections: [],
        colors: [],
        fonts: [],
        modules: [],
        meta: {},
        builder: undefined,
        html: "",
        css: "",
        htmlUrl: undefined,
        cssUrl: undefined,
        metaUrl: undefined,
        previewUrl: "",
        previewVideo: undefined,
        activeVersion: {
          number: "1.0.0",
          changelog: undefined,
          htmlUrl: undefined,
          cssUrl: undefined,
          metaUrl: undefined,
          previewUrl: "",
          previewVideo: undefined,
          createdAt: new Date(),
        },
      },
    [templates]
  );

  const lastSyncedTemplateRef = useRef<{ websiteId?: string; templateId?: string }>({
    websiteId: websiteIdState,
    templateId: templates[0]?.id,
  });
  const websiteMetaRef = useRef<Record<string, unknown> | null>(null);
  const hydratedWebsiteContentRef = useRef<string | null>(null);
  const hydratedWebsiteThemeRef = useRef<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? fallbackTemplate,
    [fallbackTemplate, selectedTemplateId, templates]
  );
  const selectedTemplateIdRef = selectedTemplate.id;

  useEffect(() => {
    const sectionLabels = selectedTemplate.sections.map((section) =>
      typeof section.label === "string" && section.label.trim().length > 0
        ? section.label.trim()
        : toSentence(section.id)
    );
    setStorePages(sectionLabels.length > 0 ? sectionLabels : [...DEFAULT_BUILDER_PAGES]);
  }, [selectedTemplate, setStorePages]);

  const websiteNameForStore = useMemo(() => {
    const contentRecord = content as Record<string, unknown>;
    const candidates: unknown[] = [
      contentRecord["siteName"],
      contentRecord["websiteName"],
      contentRecord["businessName"],
      contentRecord["name"],
      selectedTemplate?.name,
    ];

    const resolved = candidates.find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    return resolved ? resolved.trim() : "Untitled Website";
  }, [content, selectedTemplate?.name]);

  useEffect(() => {
    setStoreWebsiteName(websiteNameForStore);
  }, [setStoreWebsiteName, websiteNameForStore]);

  const themeNameForStore = useMemo(() => {
    const candidates: unknown[] = [
      theme.name,
      theme.label,
      themeDefaults.name,
      themeDefaults.label,
    ];

    const resolved = candidates.find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    return resolved ? resolved.trim() : "Default";
  }, [themeDefaults.label, themeDefaults.name, theme.label, theme.name]);

  useEffect(() => {
    setStoreThemeName(themeNameForStore);
  }, [setStoreThemeName, themeNameForStore]);

  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);

  const updateTheme = useCallback(
    (changes: Partial<ThemeState>) => {
      const schedule =
        typeof queueMicrotask === "function"
          ? queueMicrotask
          : (cb: () => void) => {
              Promise.resolve().then(cb);
            };

      schedule(() => {
        startTransition(() => {
          setTheme((prev) => {
            const nextColors = changes.colors
              ? { ...prev.colors, ...changes.colors }
              : prev.colors;
            const nextFonts = changes.fonts
              ? { ...prev.fonts, ...changes.fonts }
              : prev.fonts;

            const hasTokenChanges =
              Boolean(changes.colors && Object.keys(changes.colors).length) ||
              Boolean(changes.fonts && Object.keys(changes.fonts).length);

            let nextName = changes.name ?? prev.name;
            let nextLabel = changes.label ?? prev.label;

            if (hasTokenChanges && !changes.name && !changes.label) {
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
              Promise.resolve().then(() => saveWebsiteChanges(websiteId, { theme: next }));
            }

            return next;
          });
        });
      });
    },
    [saveWebsiteChanges, setTheme, websiteId]
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
    (key: string, value: unknown) => {
      const resolvedKey = key.trim();
      if (!resolvedKey) {
        return;
      }

      setContent((prev) => {
        const current = prev[resolvedKey];
        let nextValue: unknown = value;

        if (Array.isArray(value)) {
          nextValue = value;
        } else if (Array.isArray(current)) {
          if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed.length === 0) {
              nextValue = [];
            } else {
              nextValue = [...current, trimmed];
            }
          } else if (value == null) {
            nextValue = [];
          } else {
            nextValue = current;
          }
        }

        const next = { ...prev, [resolvedKey]: nextValue };

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
    websiteMetaRef.current = null;
    hydratedWebsiteContentRef.current = null;
    hydratedWebsiteThemeRef.current = null;
  }, [templates]);

  const registerPreviewFrame = useCallback((frame: HTMLIFrameElement | null) => {
    setPreviewFrame(frame);
  }, []);

  const registerContentPlaceholders = useCallback(
    (placeholders: string[]) => {
      const { sections, keys, defaults } = buildContentSections(placeholders, selectedTemplate);
      setContentSections(sections);

      setContent((prev) => {
        const metaSources = [
          ...extractMetaContentSources(selectedTemplate.meta),
          ...extractMetaContentSources(websiteMetaRef.current),
        ];
        const fallback = createDefaultContent(keys, defaults, metaSources);
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

  const setWebsiteId = useCallback(
    (nextWebsiteId: string | undefined) => {
      setWebsiteIdState((previous) => {
        if (previous === nextWebsiteId) {
          return previous;
        }
        return nextWebsiteId;
      });
      setStoreWebsiteId(nextWebsiteId ?? null);
    },
    [setStoreWebsiteId]
  );

  useEffect(() => {
    setStoreWebsiteId(websiteId ?? null);
  }, [setStoreWebsiteId, websiteId]);

  useEffect(() => {
    websiteMetaRef.current = null;
    hydratedWebsiteContentRef.current = null;
    hydratedWebsiteThemeRef.current = null;
  }, [websiteId]);

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
    let isMounted = true;

    const loadWebsite = async () => {
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
        if (!isMounted) {
          return;
        }

        const templateId: string | undefined = data?.templateId ?? data?.template?.id;
        const lastSynced = lastSyncedTemplateRef.current;

        if (
          templateId &&
          templateId !== selectedTemplateId &&
          (lastSynced.websiteId !== websiteId || lastSynced.templateId !== templateId)
        ) {
          lastSyncedTemplateRef.current = { websiteId, templateId };
          selectTemplate(templateId);
          return;
        }

        lastSyncedTemplateRef.current = { websiteId, templateId };

        const websiteMeta = normaliseRecord(data?.meta);
        if (websiteMeta) {
          websiteMetaRef.current = websiteMeta;
        }

        const websiteContent = normaliseWebsiteContent(data?.content);
        const websiteTheme = normaliseWebsiteTheme(data?.theme);

        const metaSources = [
          ...extractMetaContentSources(selectedTemplate.meta),
          ...extractMetaContentSources(websiteMeta),
        ];
        const metaContent = flattenContentSources(metaSources);
        const mergedContent = {
          ...metaContent,
          ...(websiteContent ?? {}),
        };

        if (
          Object.keys(mergedContent).length > 0 &&
          hydratedWebsiteContentRef.current !== websiteId
        ) {
          setContent((prev) => {
            if (Object.keys(prev).length === 0) {
              return mergedContent;
            }
            return { ...prev, ...mergedContent };
          });
          hydratedWebsiteContentRef.current = websiteId;
        }

        if (websiteTheme && hydratedWebsiteThemeRef.current !== websiteId) {
          setTheme((prev) => ({
            ...prev,
            name: websiteTheme.name ?? prev.name,
            label: websiteTheme.label ?? prev.label,
            colors: { ...prev.colors, ...(websiteTheme.colors ?? {}) },
            fonts: { ...prev.fonts, ...(websiteTheme.fonts ?? {}) },
          }));
          hydratedWebsiteThemeRef.current = websiteId;
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to synchronize template with website:", error);
      }
    };

    void loadWebsite();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectTemplate, selectedTemplate, selectedTemplateId, setTheme, websiteId]);

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
      previewDocument,
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
      previewDocument,
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

  console.groupCollapsed("🧩 BuilderProvider Render");
  console.log("Phase: render start");
  console.log("Current websiteId:", websiteId);
  console.log("Theme state on render:", theme);
  console.groupEnd();

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
}
