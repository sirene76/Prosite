"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useParams } from "next/navigation";

import { useBuilder } from "@/context/BuilderContext";
import { getBuilderStepLabel, type BuilderStep } from "@/lib/builderSteps";
import { DeviceControls } from "@/components/builder/DeviceControls";
import { StepNavigation } from "@/components/builder/StepNavigation";
import BackButton from "@/components/builder/BackButton";
import SidebarSteps from "@/components/builder/SidebarSteps";
import PreviewArea from "@/components/builder/PreviewArea";
import InspectorPanel from "@/components/builder/InspectorPanel";

import "@/styles/builder-dark.css";

type BuilderLayoutClientProps = {
  children: ReactNode;
};

export function BuilderLayoutClient({ children }: BuilderLayoutClientProps) {
  const { steps, currentStep, setWebsiteId } = useBuilder();
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

  const activeStepKey = useMemo<BuilderStep | undefined>(() => {
    return steps[currentStep] ?? steps[0];
  }, [currentStep, steps]);

  const activeStepIndex = useMemo(() => {
    if (!activeStepKey) {
      return -1;
    }
    return steps.findIndex((step) => step === activeStepKey);
  }, [activeStepKey, steps]);

  const activeStepLabel = useMemo(() => {
    return activeStepKey ? getBuilderStepLabel(activeStepKey) : undefined;
  }, [activeStepKey]);

  const stepSubtitle = useMemo(() => {
    if (activeStepLabel && activeStepIndex >= 0) {
      return `Step ${activeStepIndex + 1} of ${steps.length} · ${activeStepLabel}`;
    }
    return activeStepLabel ?? null;
  }, [activeStepIndex, activeStepLabel, steps.length]);

  return (
    <div className="builder-container bg-gray-950 text-slate-100">
      <aside className="sidebar">
        <div className="sidebar-title">Prosite</div>
        <SidebarSteps steps={steps} activeStep={activeStepKey} />
      </aside>

      <main className="main">
        <div className="flex h-full flex-col gap-6">
          <div className="top-nav">
            <div className="flex items-center gap-4">
              <BackButton />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Prosite Builder
                </span>
                {stepSubtitle ? (
                  <span className="text-sm text-slate-300">{stepSubtitle}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-3">
              <DeviceControls />
              <StepNavigation />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PreviewArea />
          </div>
        </div>
      </main>

      <aside className="inspector">
        <div className="flex h-full flex-col gap-6 overflow-hidden">
          <InspectorPanel />
          <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        </div>
      </aside>
    </div>
  );
}
