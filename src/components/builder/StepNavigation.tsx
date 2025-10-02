"use client";

import clsx from "clsx";

import { useBuilder } from "@/context/BuilderContext";

function formatStepLabel(step: string) {
  return step.charAt(0).toUpperCase() + step.slice(1);
}

export function StepNavigation() {
  const { steps, currentStep, nextStep, prevStep } = useBuilder();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const nextStepName = steps[currentStep + 1];
  const nextLabel = isLastStep
    ? "Finish"
    : nextStepName
      ? `Next: ${formatStepLabel(nextStepName)}`
      : "Next";

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={prevStep}
        disabled={isFirstStep}
        className={clsx(
          "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition",
          "border-slate-700/70 bg-gray-900 text-slate-300 hover:border-slate-500 hover:text-slate-100",
          "disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        Back
      </button>
      <button
        type="button"
        onClick={nextStep}
        disabled={isLastStep}
        className={clsx(
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
          "bg-builder-accent text-slate-950 hover:brightness-110",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        {nextLabel}
      </button>
    </div>
  );
}
