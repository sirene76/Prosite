"use client";

import { useRouter } from "next/navigation";

export function StepNavigation() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    router.push("/builder/checkout");
  };

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
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        Next: Checkout
      </button>
    </div>
  );
}
