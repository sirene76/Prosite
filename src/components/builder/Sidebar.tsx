"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useBuilder } from "@/context/BuilderContext";
import { PageList } from "./PageList";
import { ThemeSelector } from "./ThemeSelector";

type SidebarProps = {
  steps: { label: string; href: string }[];
  currentIndex: number;
};

export function Sidebar({ steps, currentIndex }: SidebarProps) {
  const router = useRouter();
  const { isSidebarCollapsed, toggleSidebar, selectedTemplate } = useBuilder();

  const handleNavigate = (direction: "prev" | "next") => {
    const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < steps.length) {
      router.push(steps[nextIndex].href);
    }
  };

  return (
    <aside
      className={clsx(
        "relative flex h-full flex-col border-l border-slate-800/60 bg-builder-surface/80 transition-all duration-300",
        isSidebarCollapsed ? "w-12" : "w-80"
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute left-0 top-6 -translate-x-1/2 rounded-full border border-slate-800/70 bg-builder-surface p-1 text-slate-300 shadow-lg transition hover:border-builder-accent/60 hover:text-builder-accent"
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isSidebarCollapsed ? "▶" : "◀"}
      </button>

      <div className={clsx("flex flex-1 flex-col gap-6 overflow-hidden px-6 py-6", isSidebarCollapsed && "hidden")}> 
        <PageList pages={selectedTemplate.pages} />
        <ThemeSelector />
        <div className="mt-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleNavigate("prev")}
            disabled={currentIndex === 0}
            className="flex-1 rounded-full border border-slate-700/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-builder-accent/40 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("next")}
            disabled={currentIndex === steps.length - 1}
            className="flex-1 rounded-full bg-builder-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>
    </aside>
  );
}
