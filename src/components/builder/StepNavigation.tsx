"use client";

import { useCallback, useMemo } from "react";

import { useBuilder } from "@/context/BuilderContext";
import { getBuilderStepLabel } from "@/lib/builderSteps";

export function StepNavigation() {
  const { steps, currentStep, prevStep, goToStep } = useBuilder();

  const checkoutIndex = useMemo(() => steps.indexOf("checkout"), [steps]);

  const { hasPrevious, canGoToCheckout, nextButtonLabel } = useMemo(() => {
    const previous = currentStep > 0;
    const checkoutLabel = getBuilderStepLabel("checkout");
    const hasCheckoutStep = checkoutIndex >= 0;
    const onCheckoutStep = checkoutIndex === currentStep;

    return {
      hasPrevious: previous,
      canGoToCheckout: hasCheckoutStep && !onCheckoutStep,
      nextButtonLabel: hasCheckoutStep ? `Next: ${checkoutLabel}` : "Next",
    };
  }, [checkoutIndex, currentStep]);

  const handleNext = useCallback(() => {
    if (checkoutIndex >= 0) {
      goToStep(checkoutIndex);
    }
  }, [checkoutIndex, goToStep]);

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
        onClick={handleNext}
        disabled={!canGoToCheckout}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {nextButtonLabel}
      </button>
    </div>
  );
}
