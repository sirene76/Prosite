"use client";

import { useCallback } from "react";
import { useBuilder } from "@/context/BuilderContext";

const defaultPages: string[] = [];

type PageListProps = {
  pages?: string[];
};

export function PageList({ pages = defaultPages }: PageListProps) {
  const { previewFrame } = useBuilder();

  const handleNavigate = useCallback(
    (page: string) => {
      const id = toSectionId(page);
      previewFrame?.contentWindow?.postMessage({ type: "scroll-to", id }, "*");
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
        {pages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => handleNavigate(page)}
            className="whitespace-nowrap rounded-full border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-builder-accent/60 hover:text-white"
          >
            {toDisplayLabel(page)}
          </button>
        ))}
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

function toDisplayLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}
