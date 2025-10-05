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
      // ✅ allow going to checkout step without requiring websiteId immediately
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
      console.log("DEBUG Checkout → websiteId:", websiteId);

      if (!websiteId) {
        console.error("No websiteId found. Falling back to builder checkout step.");
        goToStep(checkoutIndex);
        return;
      }

      router.push(`/checkout/${websiteId}`);
    }
  }, [checkoutIndex, goToStep, router, websiteId]);

  return (
    <div className="flex justify-end gap-2">
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
  );
}
