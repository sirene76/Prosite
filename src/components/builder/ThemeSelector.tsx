"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useBuilder } from "@/context/BuilderContext";
import { templates } from "@/lib/templates";

const PAGE_SIZE = 3;

export function ThemeSelector() {
  const { selectedTemplate, selectTemplate } = useBuilder();
  const [page, setPage] = useState(0);

  const paginatedTemplates = useMemo(() => {
    const start = page * PAGE_SIZE;
    return templates.slice(start, start + PAGE_SIZE);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(templates.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const handlePrev = () => setPage((current) => Math.max(0, current - 1));
  const handleNext = () => setPage((current) => Math.min(totalPages - 1, current + 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">Template library</p>
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={handlePrev}
            disabled={page === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 transition hover:border-builder-accent/40 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={page >= totalPages - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 transition hover:border-builder-accent/40 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {paginatedTemplates.map((template) => (
          <button
            type="button"
            key={template.id}
            onClick={() => selectTemplate(template.id)}
            className={clsx(
              "w-full rounded-2xl border p-4 text-left transition",
              selectedTemplate.id === template.id
                ? "border-builder-accent bg-builder-accent/10"
                : "border-slate-800/70 bg-slate-900/40 hover:border-builder-accent/40"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">{template.name}</p>
                <p className="text-xs text-slate-400">{template.description}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {template.swatches.map((color) => (
                  <span key={color} className="h-8 w-8 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">More templates launching soon. Upgrade to unlock premium collections.</p>
    </div>
  );
}
