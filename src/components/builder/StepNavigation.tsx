"use client";

import { useMemo } from "react";

import { useBuilder } from "@/context/BuilderContext";

const NAVIGATION_STEPS = [
  { key: "templates", label: "Template" },
  { key: "branding", label: "Branding" },
  { key: "checkout", label: "Checkout" },
] as const;

export function StepNavigation() {
  const { currentStepKey } = useBuilder();

  const { label, index } = useMemo(() => {
    const activeIndex = NAVIGATION_STEPS.findIndex(
      (step) => step.key === currentStepKey
    );

    if (activeIndex >= 0) {
      return {
        label: NAVIGATION_STEPS[activeIndex]?.label ?? "Branding",
        index: activeIndex,
      };
    }

    const brandingIndex = NAVIGATION_STEPS.findIndex(
      (step) => step.key === "branding"
    );

    return {
      label: NAVIGATION_STEPS[brandingIndex]?.label ?? "Branding",
      index: brandingIndex >= 0 ? brandingIndex : 1,
    };
  }, [currentStepKey]);

  return (
    <div className="rounded-lg border border-slate-800/60 bg-gray-900/60 px-4 py-3 text-right shadow-sm">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Step {index + 1} of {NAVIGATION_STEPS.length}
      </p>
      <h2 className="text-base font-semibold text-slate-100">{label}</h2>
    </div>
  );
}
