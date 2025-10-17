"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useBuilder } from "@/context/BuilderContext";
import type { BuilderPanel } from "@/lib/templates";
import { useTemplateMeta } from "@/hooks/useTemplateMeta";
import { DEFAULT_BUILDER_PAGES, useBuilderStore } from "@/store/builderStore";
import { DynamicPanelRenderer } from "./panels/DynamicPanels";
import { PageList } from "./PageList";
import { ThemePanel, normaliseThemeOptions, type ThemeOption } from "./ThemePanel";
import { ContentEditor } from "./ContentEditor";
import { ContentPanel } from "./ContentPanel";
import { formatTokenLabel } from "./utils";

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
    steps,
    currentStep,
  } = useBuilder();
  const meta = useTemplateMeta(selectedTemplate);
  const resetValues = useBuilderStore((state) => state.resetValues);
  const setBuilderValues = useBuilderStore((state) => state.setValues);
  const storeTheme = useBuilderStore((state) => state.theme);
  const setStoreTheme = useBuilderStore((state) => state.setTheme);
  const setStorePages = useBuilderStore((state) => state.setPages);
  const selectedThemeName = useBuilderStore((state) => state.selectedTheme);
  const setSelectedThemeName = useBuilderStore((state) => state.setSelectedTheme);
  const [activeTab, setActiveTab] = useState<TabId>("pages");
  const seededForTemplateRef = useRef<string | null>(null);
  const seededContentDefaultsRef = useRef<string | null>(null);
  const templateFieldSource = useMemo(
    () => (Array.isArray(selectedTemplate.fields) ? selectedTemplate.fields : []),
    [selectedTemplate.fields]
  );

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
    seededContentDefaultsRef.current = null;
  }, [resetValues, selectedTemplate.id]);

  useEffect(() => {
    const templateId = String(selectedTemplate.id ?? "");
    if (!templateId) {
      return;
    }

    const metaFields = Array.isArray(meta?.fields) ? meta.fields : [];
    const sourceFields = metaFields.length > 0 ? metaFields : templateFieldSource;

    if (!sourceFields.length) {
      return;
    }

    if (seededContentDefaultsRef.current === templateId) {
      return;
    }

    const defaults = Object.fromEntries(
      sourceFields
        .map((field) => {
          const key = "key" in field ? field.key : "id" in field ? field.id : undefined;
          if (typeof key !== "string" || key.trim().length === 0) {
            return null;
          }
          const rawDefault = (field as { default?: unknown }).default;
          let defaultValue: unknown = rawDefault;
          if (typeof rawDefault === "number" || typeof rawDefault === "boolean") {
            defaultValue = String(rawDefault);
          } else if (Array.isArray(rawDefault)) {
            defaultValue = rawDefault.map((item) => String(item ?? "")).join("\n");
          } else if (rawDefault == null) {
            defaultValue = "";
          }
          return [key, defaultValue ?? ""] as const;
        })
        .filter((entry): entry is readonly [string, unknown] => entry !== null)
    );

    if (Object.keys(defaults).length === 0) {
      return;
    }

    seededContentDefaultsRef.current = templateId;
    safeSchedule(() => {
      setBuilderValues(defaults);
    });
  }, [meta?.fields, selectedTemplate.id, setBuilderValues, templateFieldSource]);

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
                  meta?.fields?.length ? <ContentEditor fields={meta.fields} /> : <ContentPanel />
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
