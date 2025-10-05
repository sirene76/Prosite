"use client";

import { useEffect, useMemo, type ReactNode } from "react";

import { useBuilder } from "@/context/BuilderContext";
import { getBuilderStepLabel } from "@/lib/builderSteps";
import { DeviceControls } from "@/components/builder/DeviceControls";
import { ProgressBar } from "@/components/builder/ProgressBar";
import { Sidebar } from "@/components/builder/Sidebar";
import { WebsitePreview } from "@/components/builder/WebsitePreview";
import { StepNavigation } from "@/components/builder/StepNavigation";
import BackButton from "@/components/builder/BackButton";
import { useParams } from "next/navigation";

type BuilderLayoutClientProps = {
  children: ReactNode;
};

export function BuilderLayoutClient({ children }: BuilderLayoutClientProps) {
  const { isSidebarCollapsed, steps, currentStep, goToStep, setWebsiteId } = useBuilder();
  const params = useParams<{ websiteId?: string }>();
  const websiteIdFromParams =
    typeof params?.websiteId === "string" && params.websiteId.trim().length > 0
      ? params.websiteId.trim()
      : undefined;

  useEffect(() => {
    if (websiteIdFromParams) {
      setWebsiteId(websiteIdFromParams);
    }
  }, [setWebsiteId, websiteIdFromParams]);

  const progressSteps = useMemo(
    () => steps.map((step) => ({ key: step, label: getBuilderStepLabel(step) })),
    [steps]
  );
  const stepSummary = useMemo(() => {
    const summary = progressSteps.map((step) => step.label).join(" • ");
    return summary || "Template • Theme • Content • Checkout";
  }, [progressSteps]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-slate-100">
      <header className="border-b border-gray-900/70 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-3">
                <span className="text-slate-200">Prosite Builder</span>
                <span className="hidden text-slate-600 sm:inline">{stepSummary}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
            <DeviceControls />
            <StepNavigation />
          </div>
        </div>
        <ProgressBar steps={progressSteps} activeIndex={currentStep} onStepClick={goToStep} />
      </header>
      <main className="flex flex-1 overflow-hidden">
        <section
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
          style={{ flexBasis: isSidebarCollapsed ? "100%" : "auto" }}
        >
          <WebsitePreview />
        </section>
        <Sidebar />
      </main>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  );
}
