"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useBuilder } from "@/context/BuilderContext";
import { getBuilderStepLabel } from "@/lib/builderSteps";

export function StepNavigation() {
  const { steps, currentStep, goToStep, websiteId } = useBuilder();
  const router = useRouter();

  const checkoutIndex = useMemo(() => steps.indexOf("checkout"), [steps]);

  const { canGoToCheckout, nextButtonLabel } = useMemo(() => {
    const checkoutLabel = getBuilderStepLabel("checkout");
    const hasCheckoutStep = checkoutIndex >= 0;
    const onCheckoutStep = checkoutIndex === currentStep;

    return {
      canGoToCheckout:
        hasCheckoutStep && !onCheckoutStep && Boolean(websiteId),
      nextButtonLabel: hasCheckoutStep ? `Next: ${checkoutLabel}` : "Next",
    };
  }, [checkoutIndex, currentStep, websiteId]);

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleNext = useCallback(() => {
    if (checkoutIndex >= 0) {
      if (!websiteId) {
        console.error("No websiteId found. Falling back to builder checkout step.");
        goToStep(checkoutIndex);
        return;
      }

      router.push(`/checkout/${websiteId}`);
    }
  }, [checkoutIndex, goToStep, router, websiteId]);

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <ol className="flex flex-wrap justify-end gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
        {steps.map((step, index) => {
          const label = getBuilderStepLabel(step);
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const statusClassName = isActive
            ? "text-slate-200"
            : isComplete
              ? "text-blue-400"
              : "text-slate-600";

          return (
            <li key={step} className={`flex items-center gap-2 ${statusClassName}`}>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-[0.6rem]">
                {index + 1}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-gray-700"
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
    </div>
  );
}
