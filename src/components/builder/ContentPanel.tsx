"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useBuilder } from "@/hooks/use-builder";

import { ContentForm } from "./ContentForm";
import { ensureColorValue, formatModuleType, formatTokenLabel, normalizeSectionAnchor } from "./utils";

const sectionGradients = [
  "from-builder-accent/20 via-builder-accent/10 to-transparent",
  "from-emerald-500/15 via-emerald-400/10 to-transparent",
  "from-sky-500/15 via-sky-400/10 to-transparent",
  "from-amber-500/15 via-amber-400/10 to-transparent",
  "from-purple-500/15 via-purple-400/10 to-transparent",
];

export function ContentPanel() {
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

  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    contentSections[0] ? [contentSections[0].id] : []
  );
  const previousExpandedRef = useRef<string[]>(expandedSections);

  useEffect(() => {
    if (!contentSections.length) {
      setExpandedSections([]);
      previousExpandedRef.current = [];
      return;
    }

    setExpandedSections((previous) => {
      const valid = previous.filter((id) => contentSections.some((section) => section.id === id));
      if (valid.length > 0) {
        previousExpandedRef.current = valid;
        return valid;
      }
      const initial = contentSections[0]!.id;
      previousExpandedRef.current = [initial];
      return [initial];
    });
  }, [contentSections]);

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

  if (!contentSections.length) {
    return (
      <div className="space-y-3 rounded-2xl border border-gray-800/60 bg-gray-950/60 p-4 text-sm text-slate-400">
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

  const handleContentChange = (key: string, value: unknown) => {
    updateContent(key, value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
        <div className="space-y-3">
          {contentSections.map((section, index) => {
            const isOpen = expandedSections.includes(section.id);
            const gradient = sectionGradients[index % sectionGradients.length];

            return (
              <motion.section
                key={section.id}
                layout
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="overflow-hidden rounded-3xl border border-white/5 bg-gray-950/60 shadow-lg shadow-black/20"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`flex w-full items-center justify-between gap-4 rounded-3xl border border-white/5 bg-gradient-to-br ${gradient} px-5 py-4 text-left transition hover:border-white/20`}
                >
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">
                      {section.label}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{section.fields.length} fields</span>
                      {section.description ? <span className="hidden text-[11px] sm:inline">• {section.description}</span> : null}
                    </div>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-full bg-white/5 p-1 text-slate-300"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
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
                        <ContentForm section={section} values={content} onChange={handleContentChange} />
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
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Theme colors</p>
          <div className="space-y-3">
            {colors.map((color) => {
              const key = color.id;
              const appliedValue = theme.colors[key] ?? themeDefaults.colors[key] ?? color.default ?? "";
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 p-3"
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
                        value={ensureColorValue(theme.colors[key] ?? themeDefaults.colors[key] ?? color.default)}
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
