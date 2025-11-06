"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useBuilder } from "@/context/BuilderContext";
import { PageList } from "./PageList";
import { ThemeSelector } from "./ThemeSelector";
import { ContentAccordion } from "./ContentAccordion";

type SidebarProps = {
  steps: { label: string; href: string }[];
  currentIndex: number;
};

const tabs = [
  { id: "pages", label: "Pages" },
  { id: "theme", label: "Theme" },
  { id: "content", label: "Content" }
] as const;

const STEP_ORDER = ["theme", "content", "checkout"] as const;

type StepKey = (typeof STEP_ORDER)[number];

function formatStepLabel(step: StepKey) {
  return step.charAt(0).toUpperCase() + step.slice(1);
}

type TabId = (typeof tabs)[number]["id"];

export function Sidebar({ steps, currentIndex }: SidebarProps) {
  const router = useRouter();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    selectedTemplate,
  } = useBuilder();
  const [activeTab, setActiveTab] = useState<TabId>("pages");

  const currentStepLabel = useMemo(() => steps[currentIndex]?.label ?? "", [currentIndex, steps]);

  const currentStepKey = STEP_ORDER[currentIndex] ?? STEP_ORDER[0];
  const currentStepPosition = STEP_ORDER.findIndex((step) => step === currentStepKey);
  const nextStepKey =
    currentStepPosition >= 0 && currentStepPosition < STEP_ORDER.length - 1
      ? STEP_ORDER[currentStepPosition + 1]
      : undefined;
  const nextButtonLabel =
    currentStepKey === "checkout"
      ? "Finish"
      : nextStepKey
        ? `Next: ${formatStepLabel(nextStepKey)}`
        : "Next";

  const handleNavigate = (direction: "prev" | "next") => {
    const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < steps.length) {
      router.push(steps[nextIndex].href);
    }
  };

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
            <p className="text-sm font-medium text-slate-200">{currentStepLabel || "Builder"}</p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="px-4 pt-4">
              <div className="grid grid-cols-3 gap-2 rounded-full bg-gray-800/60 p-1 text-xs font-medium text-slate-400">
                {tabs.map((tab) => (
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
                    <PageList pages={selectedTemplate.pages} />
                  </div>
                ) : null}

                {activeTab === "theme" ? <ThemeSelector /> : null}

                {activeTab === "content" ? (
                  <ContentAccordion meta={selectedTemplate.meta} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-900/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate("prev")}
                disabled={currentIndex === 0}
                className="flex-1 rounded-full border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("next")}
                disabled={currentIndex === steps.length - 1}
                className="flex-1 rounded-full bg-builder-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {nextButtonLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
