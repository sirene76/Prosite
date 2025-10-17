"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Clock3 } from "lucide-react";

import { useBuilder } from "@/hooks/use-builder";

import { ContentForm } from "./ContentForm";
import { ensureColorValue, formatModuleType, formatTokenLabel, normalizeSectionAnchor } from "./utils";
import type { TemplateContentSection } from "@/context/BuilderContext";

type ContentPanelProps = {
  sections?: TemplateContentSection[];
  values?: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
};

type SectionAccent = {
  header: string;
  shadow: string;
};

const sectionAccents: SectionAccent[] = [
  {
    header: "from-builder-accent/25 via-builder-accent/10 to-transparent",
    shadow: "shadow-[0_18px_48px_-28px_rgba(56,189,248,0.55)]",
  },
  {
    header: "from-emerald-500/25 via-emerald-400/10 to-transparent",
    shadow: "shadow-[0_18px_48px_-28px_rgba(16,185,129,0.45)]",
  },
  {
    header: "from-sky-500/25 via-sky-400/10 to-transparent",
    shadow: "shadow-[0_18px_48px_-28px_rgba(14,165,233,0.45)]",
  },
  {
    header: "from-amber-500/25 via-amber-400/10 to-transparent",
    shadow: "shadow-[0_18px_48px_-28px_rgba(245,158,11,0.45)]",
  },
  {
    header: "from-purple-500/25 via-purple-400/10 to-transparent",
    shadow: "shadow-[0_18px_48px_-28px_rgba(168,85,247,0.45)]",
  },
];

function isValueFilled(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

export function ContentPanel({ sections, values, onChange }: ContentPanelProps = {}) {
  const {
    contentSections,
    content,
    updateContent,
    previewFrame,
    selectedTemplate,
    theme,
    themeDefaults,
    updateTheme,
  } = useBuilder();

  const colors = useMemo(() => selectedTemplate.colors ?? [], [selectedTemplate]);
  const modules = useMemo(() => selectedTemplate.modules ?? [], [selectedTemplate]);

  const resolvedSections = useMemo(() => {
    return Array.isArray(sections) && sections.length > 0 ? sections : contentSections;
  }, [contentSections, sections]);

  const resolvedValues = useMemo(() => {
    if (values && typeof values === "object") {
      return values;
    }
    return content;
  }, [content, values]);

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      if (onChange) {
        onChange(key, value);
        return;
      }
      updateContent(key, value);
    },
    [onChange, updateContent]
  );

  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    resolvedSections[0] ? [resolvedSections[0].id] : []
  );
  const previousExpandedRef = useRef<string[]>(expandedSections);

  useEffect(() => {
    if (!resolvedSections.length) {
      setExpandedSections([]);
      previousExpandedRef.current = [];
      return;
    }

    setExpandedSections((previous) => {
      const valid = previous.filter((id) => resolvedSections.some((section) => section.id === id));
      if (valid.length > 0) {
        previousExpandedRef.current = valid;
        return valid;
      }
      const initial = resolvedSections[0]!.id;
      previousExpandedRef.current = [initial];
      return [initial];
    });
  }, [resolvedSections]);

  useEffect(() => {
    const previous = previousExpandedRef.current;
    const newlyOpened = expandedSections.find((id) => !previous.includes(id));
    previousExpandedRef.current = expandedSections;

    if (!newlyOpened) {
      return;
    }

    const anchor = normalizeSectionAnchor(newlyOpened);
    if (!anchor || !previewFrame?.contentWindow) {
      return;
    }

    previewFrame.contentWindow.postMessage(
      {
        type: "scrollTo",
        anchor,
      },
      "*"
    );
  }, [expandedSections, previewFrame]);

  if (!resolvedSections.length) {
    return (
      <div className="space-y-3 rounded-2xl border border-gray-800/60 bg-gray-950/60 p-5 text-sm text-slate-400">
        <p>No editable fields found for this template.</p>
        <p className="text-xs text-slate-500">
          Add <code>{"{{ placeholder }}"}</code> tokens to the HTML or define fields inside <code>meta.json</code> to manage the
          content here.
        </p>
      </div>
    );
  }

  const toggleSection = (id: string) => {
    setExpandedSections((previous) => {
      if (previous.includes(id)) {
        return previous.filter((value) => value !== id);
      }
      return [id];
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
          <p className="text-[11px] text-slate-500">
            Manage your content by opening each tag card and updating the fields.
          </p>
        </div>
        <div className="space-y-4">
          {resolvedSections.map((section, index) => {
            const isOpen = expandedSections.includes(section.id);
            const accent = sectionAccents[index % sectionAccents.length];

            const totalFields = section.fields.length;
            const filledFields = section.fields.reduce((count, field) => {
              if (isValueFilled(resolvedValues[field.key])) {
                return count + 1;
              }
              return count;
            }, 0);

            const isComplete = totalFields > 0 && filledFields === totalFields;
            const statusLabel = isComplete ? "Success" : "Pending";
            const statusClasses = isComplete
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
              : "border-amber-400/40 bg-amber-500/15 text-amber-200";
            const StatusIcon = isComplete ? CheckCircle2 : Clock3;

            return (
              <motion.section
                key={section.id}
                layout
                transition={{ type: "spring", stiffness: 220, damping: 30 }}
                className={`relative overflow-hidden rounded-3xl border border-white/5 bg-gray-950/70 ${accent.shadow}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent" />
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`relative flex w-full items-center justify-between gap-6 rounded-3xl border border-white/5 bg-gradient-to-br ${accent.header} px-5 py-4 text-left transition hover:border-white/20`}
                >
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-200">
                      {section.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        {filledFields}/{totalFields} fields ready
                      </span>
                      {section.description ? (
                        <span className="hidden text-[11px] sm:inline">• {section.description}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.span layout className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${statusClasses}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusLabel}
                    </motion.span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-full bg-white/5 p-1 text-slate-300"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="border-t border-white/5 bg-gray-950/80"
                    >
                      <div className="space-y-4 px-5 pb-5 pt-4">
                        <ContentForm section={section} values={resolvedValues} onChange={handleChange} />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </div>
      </div>

      {colors.length ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Theme colors</p>
            <span className="text-[11px] text-slate-500">Adjust accent tokens for this template</span>
          </div>
          <div className="space-y-3">
            {colors.map((color) => {
              const key = color.id;
              const appliedValue = theme.colors[key] ?? themeDefaults.colors[key] ?? color.default ?? "";
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 p-4"
                >
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
                    style={{ backgroundColor: appliedValue || "transparent" }}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {color.label ?? formatTokenLabel(key)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="color"
                        value={ensureColorValue(theme.colors[key] ?? themeDefaults.colors[key] ?? color.default)}
                        onChange={(event) => updateTheme({ colors: { [key]: event.target.value } })}
                        className="h-9 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
                      />
                      <input
                        type="text"
                        value={theme.colors[key] ?? ""}
                        placeholder={themeDefaults.colors[key] ?? color.default ?? "#000000"}
                        onChange={(event) => updateTheme({ colors: { [key]: event.target.value } })}
                        className="min-w-[140px] flex-1 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-slate-100 focus:border-builder-accent focus:outline-none"
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
                className="space-y-2 rounded-2xl border border-gray-800/60 bg-gray-950/60 p-4"
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
            Modules render directly inside the live preview. Switch templates or update <code>meta.json</code> to change what appears here.
          </p>
        </div>
      ) : null}
    </div>
  );
}
