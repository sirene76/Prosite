"use client";

import { useCallback, useMemo } from "react";

import { useBuilder } from "@/context/BuilderContext";
import type { TemplateSectionDefinition } from "@/lib/templates";
import { useBuilderStore } from "@/store/builderStore";

type PageListProps = {
  pages?: TemplateSectionDefinition[];
};

export function PageList({ pages = [] }: PageListProps) {
  const { previewFrame } = useBuilder();
  const fallbackPages = useBuilderStore((state) => state.pages);

  const pagesToRender = useMemo<TemplateSectionDefinition[]>(() => {
    if (pages && pages.length > 0) {
      return pages;
    }

    if (!fallbackPages.length) {
      return [];
    }

    return fallbackPages.map((label) => ({
      id: toSectionId(label),
      label,
      fields: [],
    }));
  }, [fallbackPages, pages]);

  const handleNavigate = useCallback(
    (page: TemplateSectionDefinition) => {
      const id = toSectionId(page.id);
      const iframe =
        document.querySelector<HTMLIFrameElement>("#preview-frame") ?? previewFrame;
      iframe?.contentWindow?.postMessage({ type: "scrollTo", target: id }, "*");
    },
    [previewFrame]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
        <span>Pages</span>
        <button
          type="button"
          className="text-[10px] font-semibold text-slate-500 transition hover:text-slate-300"
        >
          Manage
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {pagesToRender.length > 0 ? (
          pagesToRender.map((page) => (
            <button
              type="button"
              key={page.id}
              onClick={() => handleNavigate(page)}
              className="whitespace-nowrap rounded-full border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-builder-accent/60 hover:text-white"
            >
              {page.label}
            </button>
          ))
        ) : (
          <p className="px-2 text-sm text-slate-400">No pages yet.</p>
        )}
      </div>
    </div>
  );
}

function toSectionId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

