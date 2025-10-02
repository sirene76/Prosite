"use client";

import { useMemo } from "react";

import { useBuilder } from "@/context/BuilderContext";
import { getBuilderStepLabel } from "@/lib/builderSteps";

export function StepNavigation() {
  const { steps, currentStep, prevStep, nextStep } = useBuilder();

  const { hasPrevious, hasNext, nextLabel } = useMemo(() => {
    const previous = currentStep > 0;
    const next = currentStep < steps.length - 1;
    return {
      hasPrevious: previous,
      hasNext: next,
      nextLabel: next ? getBuilderStepLabel(steps[currentStep + 1]) : null,
    };
  }, [currentStep, steps]);

  const nextButtonLabel = hasNext ? `Next: ${nextLabel}` : "Final step";

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={prevStep}
        disabled={!hasPrevious}
        className="rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={nextStep}
        disabled={!hasNext}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {nextButtonLabel}
      </button>
    </div>
  );
}
