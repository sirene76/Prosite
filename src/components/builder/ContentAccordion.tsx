"use client";

import { useMemo } from "react";
import clsx from "clsx";

import { useBuilder } from "@/context/BuilderContext";
import type { TemplateMeta } from "@/lib/templateDefinitions";

type ContentAccordionProps = {
  meta: TemplateMeta | undefined;
};

type SectionField = {
  id: string;
  label: string;
  helper?: string;
  type: "textarea" | "email" | "text";
  defaultValue: string;
};

type Section = {
  id: string;
  title: string;
  description?: string;
  fields: SectionField[];
};

function formatSectionTitle(sectionId: string) {
  return sectionId
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[\-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ContentAccordion({ meta }: ContentAccordionProps) {
  const {
    content: values,
    updateContent,
    openContentSection,
    setOpenContentSection,
  } = useBuilder();

  const sections = useMemo<Section[]>(() => {
    if (!meta?.content) {
      return [];
    }

    const entries = Object.entries(meta.content);
    const grouped = new Map<string, Section>();

    for (const [fieldId, fieldMeta] of entries) {
      const [sectionId] = fieldId.split(".");
      if (!sectionId) {
        continue;
      }

      if (!grouped.has(sectionId)) {
        const sectionMeta = meta.contentSections?.[sectionId];
        grouped.set(sectionId, {
          id: sectionId,
          title: sectionMeta?.title ?? formatSectionTitle(sectionId),
          description: sectionMeta?.description,
          fields: [],
        });
      }

      const section = grouped.get(sectionId);
      if (!section) {
        continue;
      }

      section.fields.push({
        id: fieldId,
        label: fieldMeta.label,
        helper: fieldMeta.helper,
        type: fieldMeta.type ?? "text",
        defaultValue: fieldMeta.default ?? "",
      });
    }

    return Array.from(grouped.values());
  }, [meta]);

  if (!sections.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isOpen = openContentSection === section.id;

        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-2xl border border-gray-800/60 bg-gray-950/50"
          >
            <button
              type="button"
              onClick={() =>
                setOpenContentSection(isOpen ? null : section.id)
              }
              className={clsx(
                "flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition",
                isOpen ? "text-slate-100" : "text-slate-300 hover:text-slate-100"
              )}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                  {section.title}
                </span>
                {section.description ? (
                  <span className="text-xs font-medium text-slate-500">
                    {section.description}
                  </span>
                ) : null}
              </div>
              <span
                className={clsx(
                  "flex h-7 w-7 items-center justify-center rounded-full border border-gray-800 text-xs transition",
                  isOpen
                    ? "bg-builder-accent/20 text-builder-accent"
                    : "bg-gray-900 text-slate-400"
                )}
                aria-hidden
              >
                {isOpen ? "–" : "+"}
              </span>
            </button>

            <div
              className={clsx(
                "grid overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0 space-y-4 border-t border-gray-800/60 bg-gray-950/60 px-4 py-4">
                {section.fields.map((field) => {
                  const value = values[field.id] ?? field.defaultValue;

                  return (
                    <label
                      key={field.id}
                      className="flex flex-col gap-2"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {field.label}
                      </span>
                      {field.helper ? (
                        <span className="text-[11px] text-slate-500">
                          {field.helper}
                        </span>
                      ) : null}

                      {field.type === "textarea" ? (
                        <textarea
                          value={value}
                          onChange={(event) =>
                            updateContent({ [field.id]: event.target.value })
                          }
                          rows={4}
                          className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/40 transition focus:border-builder-accent focus:outline-none"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={value}
                          onChange={(event) =>
                            updateContent({ [field.id]: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-builder-accent focus:outline-none"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
