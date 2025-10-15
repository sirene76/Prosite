"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useBuilder, type TemplateContentSection } from "@/context/BuilderContext";
import type { BuilderPanel, TemplateColorDefinition, TemplateModuleDefinition } from "@/lib/templates";
import { useTemplateMeta } from "@/hooks/useTemplateMeta";
import { DEFAULT_BUILDER_PAGES, useBuilderStore } from "@/store/builderStore";
import { DynamicPanelRenderer } from "./panels/DynamicPanels";
import { PageList } from "./PageList";
import { ThemePanel, normaliseThemeOptions, type ThemeOption } from "./ThemePanel";
import { ContentForm } from "./ContentForm";
import { ContentEditor } from "./ContentEditor";

const safeSchedule = (cb: () => void) =>
  typeof queueMicrotask === "function" ? queueMicrotask(cb) : Promise.resolve().then(cb);

function shallowEqualColors(a: Record<string, string> = {}, b: Record<string, string> = {}) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const av = a[key]?.toLowerCase?.() ?? a[key];
    const bv = b[key]?.toLowerCase?.() ?? b[key];
    if (av !== bv) return false;
  }
  return true;
}

const baseTabs = [
  { id: "pages", label: "Pages" },
  { id: "theme", label: "Theme" },
  { id: "content", label: "Content" },
] as const;

function formatStepLabel(step: string) {
  return step.charAt(0).toUpperCase() + step.slice(1);
}

function toSentence(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

type TabId = (typeof baseTabs)[number]["id"] | string;

export function Sidebar() {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    selectedTemplate,
    content,
    updateContent,
    previewFrame,
    contentSections,
    theme,
    themeDefaults,
    updateTheme,
    steps,
    currentStep,
  } = useBuilder();
  const meta = useTemplateMeta(selectedTemplate);
  const resetValues = useBuilderStore((state) => state.resetValues);
  const storeTheme = useBuilderStore((state) => state.theme);
  const setStoreTheme = useBuilderStore((state) => state.setTheme);
  const setStorePages = useBuilderStore((state) => state.setPages);
  const selectedThemeName = useBuilderStore((state) => state.selectedTheme);
  const setSelectedThemeName = useBuilderStore((state) => state.setSelectedTheme);
  const [activeTab, setActiveTab] = useState<TabId>("pages");
  const seededForTemplateRef = useRef<string | null>(null);

  const currentStepKey = steps[currentStep] ?? steps[0];

  const customPanels = useMemo(() => {
    const panels = selectedTemplate.meta?.builder?.customPanels;
    return Array.isArray(panels) ? (panels as BuilderPanel[]) : [];
  }, [selectedTemplate]);
  const allTabs = useMemo(
    () => [...baseTabs, ...customPanels.map((panel) => ({ id: panel.id, label: panel.label }))],
    [customPanels]
  );

  const themeOptions = useMemo<ThemeOption[]>(() => {
    const inlineThemes = normaliseThemeOptions(meta?.themes);
    if (inlineThemes.length > 0) {
      return inlineThemes;
    }
    return normaliseThemeOptions(selectedTemplate.meta?.themes);
  }, [meta?.themes, selectedTemplate.meta]);

  useEffect(() => {
    if (!themeOptions.length) {
      return;
    }

    const hasActiveTheme = themeOptions.some((theme) => theme.name === selectedThemeName);
    if (!hasActiveTheme) {
      setSelectedThemeName(themeOptions[0].name);
    }
  }, [themeOptions, selectedThemeName, setSelectedThemeName]);

  const metaPages = useMemo(() => {
    const inlinePages = normalisePages(meta?.pages);
    if (inlinePages.length > 0) {
      return inlinePages;
    }
    return normalisePages(selectedTemplate.meta?.pages);
  }, [meta?.pages, selectedTemplate.meta]);

  const modulePages = useMemo(() => {
    return selectedTemplate.modules.map((module) => {
      const label =
        typeof module.label === "string" && module.label.trim().length > 0
          ? module.label.trim()
          : formatTokenLabel(module.id);
      return {
        id: module.id,
        label,
        scrollAnchor: module.id,
      };
    });
  }, [selectedTemplate.modules]);

  const pagesForSidebar = metaPages.length > 0 ? metaPages : modulePages;

  useEffect(() => {
    if (baseTabs.some((tab) => tab.id === activeTab)) {
      return;
    }
    if (customPanels.some((panel) => panel.id === activeTab)) {
      return;
    }
    if (customPanels.length > 0) {
      setActiveTab(customPanels[0].id);
      return;
    }
    setActiveTab("pages");
  }, [activeTab, customPanels]);

  useEffect(() => {
    resetValues();
  }, [resetValues, selectedTemplate.id]);

  useEffect(() => {
    const templateId = String(selectedTemplate.id ?? "");
    const hasOptions = Array.isArray(themeOptions) && themeOptions.length > 0;

    if (!hasOptions) {
      if (seededForTemplateRef.current !== templateId) {
        seededForTemplateRef.current = templateId;
        safeSchedule(() => setStoreTheme({}));
      }
      return;
    }

    const firstColors = themeOptions[0]?.colors ?? {};
    const alreadySeeded = seededForTemplateRef.current === templateId;

    if (!alreadySeeded || !shallowEqualColors(storeTheme, firstColors)) {
      seededForTemplateRef.current = templateId;
      safeSchedule(() => {
        const current = useBuilderStore.getState().theme;
        if (!shallowEqualColors(current, firstColors)) {
          setStoreTheme(firstColors);
        }
      });
    }
  }, [selectedTemplate.id, setStoreTheme, storeTheme, themeOptions]);

  useEffect(() => {
    if (pagesForSidebar.length > 0) {
      setStorePages(pagesForSidebar.map((page) => page.label));
      return;
    }

    const sectionLabels = selectedTemplate.sections.map((section) =>
      typeof section.label === "string" && section.label.trim().length > 0
        ? section.label.trim()
        : toSentence(section.id)
    );
    setStorePages(sectionLabels.length > 0 ? sectionLabels : [...DEFAULT_BUILDER_PAGES]);
  }, [pagesForSidebar, selectedTemplate.sections, setStorePages]);


  return (
    <aside
      className={clsx(
        "relative flex h-full flex-col border-l border-gray-900/70 bg-gray-900/80 text-slate-200 backdrop-blur transition-all duration-300",
        isSidebarCollapsed ? "w-14" : "w-[22rem]"
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute left-[-18px] top-6 flex h-9 w-9 items-center justify-center rounded-full border border-gray-900 bg-gray-950 text-slate-300 shadow-xl shadow-black/40 transition hover:text-white"
        aria-label={isSidebarCollapsed ? "Expand inspector" : "Collapse inspector"}
      >
        <span className="text-lg leading-none">{isSidebarCollapsed ? "›" : "‹"}</span>
      </button>

      {!isSidebarCollapsed ? (
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="border-b border-gray-900/60 px-4 pb-4 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Inspector</p>
            <p className="text-sm font-medium text-slate-200">{formatStepLabel(currentStepKey ?? "") || "Builder"}</p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="px-4 pt-4">
              <div className="grid grid-cols-3 gap-2 rounded-full bg-gray-800/60 p-1 text-xs font-medium text-slate-400">
                {allTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "rounded-full px-3 py-1.5 transition",
                      activeTab === tab.id
                        ? "bg-gray-950 text-slate-100 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)]"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {activeTab === "pages" ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Structure</p>
                      <p className="text-sm font-semibold text-slate-100">{selectedTemplate.name}</p>
                    </div>
                    <div className="overflow-x-auto w-full">
                    <PageList pages={pagesForSidebar} />
                    </div>
                  </div>
                ) : null}

                {activeTab === "theme" ? <ThemePanel themes={themeOptions} /> : null}

                {activeTab === "content" ? (
                  meta?.fields?.length ? (
                    <ContentEditor fields={meta.fields} />
                  ) : (
                    <ContentPanel
                      sections={contentSections}
                      content={content}
                      updateContent={updateContent}
                      previewFrame={previewFrame}
                      colors={selectedTemplate.colors}
                      theme={theme}
                      themeDefaults={themeDefaults}
                      updateTheme={updateTheme}
                      modules={selectedTemplate.modules}
                    />
                  )
                ) : null}

                {customPanels.map((panel) =>
                  activeTab === panel.id ? (
                    <DynamicPanelRenderer key={panel.id} panel={panel} />
                  ) : null
                )}
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </aside>
  );
}

type ThemeValues = {
  colors: Record<string, string>;
  fonts: Record<string, string>;
};

type ContentPanelProps = {
  sections: TemplateContentSection[];
  content: Record<string, unknown>;
  updateContent: (key: string, value: unknown) => void;
  previewFrame: HTMLIFrameElement | null;
  colors: TemplateColorDefinition[];
  theme: ThemeValues;
  themeDefaults: ThemeValues;
  updateTheme: (changes: Partial<ThemeValues>) => void;
  modules: TemplateModuleDefinition[];
};

function ContentPanel({
  sections,
  content,
  updateContent,
  previewFrame,
  colors,
  theme,
  themeDefaults,
  updateTheme,
  modules,
}: ContentPanelProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    if (!sections.length) {
      setActiveSectionId(null);
      return;
    }

    setActiveSectionId((previous) => {
      if (previous && sections.some((section) => section.id === previous)) {
        return previous;
      }
      return sections[0]?.id ?? null;
    });
  }, [sections]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  useEffect(() => {
    if (!previewFrame?.contentWindow || !activeSection) {
      return;
    }

    const anchor = normalizeSectionAnchor(activeSection.id);
    if (!anchor) {
      return;
    }

    previewFrame.contentWindow.postMessage(
      {
        type: "scrollTo",
        anchor,
      },
      "*"
    );
  }, [activeSection, previewFrame]);

  if (!sections.length) {
    return (
      <div className="space-y-3 rounded-2xl border border-gray-800/60 bg-gray-950/60 p-4 text-sm text-slate-400">
        <p>No editable fields found for this template.</p>
        <p className="text-xs text-slate-500">
          Add <code>{"{{ placeholder }}"}</code> tokens to the HTML or define fields inside <code>meta.json</code> to manage them here.
        </p>
      </div>
    );
  }

  const handleContentChange = (key: string, value: unknown) => {
    updateContent(key, value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const isActive = section.id === activeSection?.id;
            return (
              <button
                type="button"
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  isActive
                    ? "border-builder-accent bg-builder-accent/10 text-builder-accent"
                    : "border-gray-800 bg-gray-950/70 text-slate-300 hover:border-builder-accent/50 hover:text-slate-100"
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeSection ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Editing <span className="text-slate-300">{activeSection.label}</span>
              </p>
              {activeSection.description ? (
                <p className="text-xs text-slate-500">{activeSection.description}</p>
              ) : null}
            </div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
              {activeSection.fields.length} fields
            </span>
          </div>
          <div className="rounded-2xl border border-gray-800/60 bg-gray-950/50 p-4">
            <ContentForm section={activeSection} values={content} onChange={handleContentChange} />
          </div>
        </div>
      ) : null}

      {colors.length ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Theme colors</p>
          <div className="space-y-3">
            {colors.map((color) => {
              const key = color.id;
              const appliedValue =
                theme.colors[key] ?? themeDefaults.colors[key] ?? color.default ?? "";
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-3"
                >
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
                    style={{ backgroundColor: appliedValue || "transparent" }}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {color.label ?? formatTokenLabel(key)}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={ensureColorValue(
                          theme.colors[key] ?? themeDefaults.colors[key] ?? color.default
                        )}
                        onChange={(event) => updateTheme({ colors: { [key]: event.target.value } })}
                        className="h-9 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
                      />
                      <input
                        type="text"
                        value={theme.colors[key] ?? ""}
                        placeholder={themeDefaults.colors[key] ?? color.default ?? "#000000"}
                        onChange={(event) => updateTheme({ colors: { [key]: event.target.value } })}
                        className="flex-1 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-100 focus:border-builder-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateTheme({ colors: { [key]: color.default ?? "" } })}
                        className="rounded-lg border border-gray-800 bg-gray-950/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-builder-accent/50 hover:text-slate-100"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {modules.length ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Modules</p>
          <div className="space-y-3">
            {modules.map((module) => (
              <div
                key={module.id}
                className="space-y-2 rounded-2xl border border-gray-800/60 bg-gray-950/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">{module.label}</p>
                  <span className="rounded-full border border-gray-800 bg-gray-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {formatModuleType(module.type)}
                  </span>
                </div>
                {module.description ? (
                  <p className="text-xs text-slate-400">{module.description}</p>
                ) : null}
                {module.type === "iframe" && module.url ? (
                  <p className="text-[11px] text-slate-500">
                    Embed URL: <span className="break-all text-slate-400">{module.url}</span>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Modules render directly inside the live preview. Switch templates or update <code>meta.json</code> to change what appears
            here.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function normalizeSectionAnchor(id?: string | null) {
  if (typeof id !== "string") {
    return null;
  }

  const trimmed = id.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function ensureColorValue(value: string | undefined) {
  if (!value) {
    return "#000000";
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

function formatModuleType(type: TemplateModuleDefinition["type"]) {
  if (type === "iframe") {
    return "Iframe";
  }
  if (type === "integration") {
    return "Integration";
  }
  return "Form";
}

function formatTokenLabel(token: string) {
  return token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

type MetaPageDefinition = {
  id: string;
  label: string;
  scrollAnchor?: string;
};

function normalisePages(source: unknown): MetaPageDefinition[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((page) => {
      if (
        page &&
        typeof page === "object" &&
        typeof (page as { id?: unknown }).id === "string" &&
        typeof (page as { label?: unknown }).label === "string"
      ) {
        const scrollAnchor =
          typeof (page as { scrollAnchor?: unknown }).scrollAnchor === "string"
            ? (page as { scrollAnchor: string }).scrollAnchor
            : undefined;

        return {
          id: (page as { id: string }).id,
          label: (page as { label: string }).label,
          scrollAnchor,
        } as MetaPageDefinition;
      }

      return null;
    })
    .filter((page): page is MetaPageDefinition => Boolean(page));
}
