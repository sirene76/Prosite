"use client";

const defaultPages = ["Home", "About", "Services", "Contact"];

type PageListProps = {
  pages?: string[];
};

export function PageList({ pages = defaultPages }: PageListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">Pages</p>
        <button type="button" className="text-xs font-medium text-builder-accent transition hover:underline">
          Manage
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {pages.map((page) => (
          <button
            type="button"
            key={page}
            className="whitespace-nowrap rounded-full border border-slate-700/70 bg-slate-900/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-builder-accent/40 hover:text-slate-100"
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}
