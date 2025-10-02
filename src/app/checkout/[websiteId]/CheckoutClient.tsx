"use client";

import { useState } from "react";
import Image from "next/image";

const PLAN_PRICING: Record<PlanId, { price: string; description: string }> = {
  free: { price: "$0/mo", description: "Basic hosting with limited features" },
  pro: { price: "$29/mo", description: "Full access to Prosite tools and analytics" },
  agency: { price: "$99/mo", description: "Advanced collaboration and priority support" },
};

type PlanId = "free" | "pro" | "agency";

type CheckoutClientProps = {
  websiteId: string;
  websiteName: string;
  templateName: string;
  themeName: string;
  previewImage: string;
  initialError?: string | null;
};

export function CheckoutClient({
  websiteId,
  websiteName,
  templateName,
  themeName,
  previewImage,
  initialError = null,
}: CheckoutClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const handleProceed = async () => {
    if (isSubmitting) return;

    if (selectedPlan === "free") {
      window.location.href = `/dashboard?plan=free&website=${encodeURIComponent(websiteId)}`;
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        body: JSON.stringify({ websiteId, plan: selectedPlan }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError(data?.error ?? "Unable to start checkout. Please try again.");
    } catch (err) {
      console.error(err);
      setError("Unexpected error starting checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl bg-white/5 p-10 text-white shadow-xl shadow-blue-950/30 lg:flex-row">
      <section className="flex-1 space-y-8">
        <div className="flex flex-col gap-6 rounded-2xl bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{websiteName}</h1>
              <p className="text-sm text-slate-300">Review your site details before heading to Stripe checkout.</p>
            </div>
            <div className="text-sm text-slate-300">
              <p><span className="font-medium text-white">Template:</span> {templateName}</p>
              <p><span className="font-medium text-white">Theme:</span> {themeName}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/80">
            <div className="relative h-64 w-full bg-slate-800">
              <Image
                src={previewImage}
                alt={`${websiteName} preview`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Choose your plan</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(PLAN_PRICING) as PlanId[]).map((plan) => {
              const isSelected = selectedPlan === plan;
              const { price, description } = PLAN_PRICING[plan];

              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`flex h-full flex-col rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                    isSelected
                      ? "border-blue-500 bg-blue-600/20 ring-2 ring-blue-400"
                      : "border-white/10 bg-white/5 hover:border-blue-500/60"
                  }`}
                >
                  <span className="text-sm uppercase tracking-wide text-slate-300">{plan}</span>
                  <span className="mt-2 text-2xl font-semibold text-white">{price}</span>
                  <span className="mt-3 text-sm text-slate-300">{description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div>
          <h2 className="text-lg font-semibold text-white">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <dt>Website</dt>
              <dd className="text-white">{websiteName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Template</dt>
              <dd className="text-white">{templateName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Theme</dt>
              <dd className="text-white">{themeName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Plan</dt>
              <dd className="text-white">{selectedPlan.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Price</dt>
              <dd className="text-white">{PLAN_PRICING[selectedPlan].price}</dd>
            </div>
          </dl>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={handleProceed}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-full bg-blue-500 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {selectedPlan === "free" ? "Activate Free Plan" : isSubmitting ? "Redirecting..." : "Proceed to Payment"}
        </button>

        <p className="text-xs text-slate-400">
          Payments are securely processed by Stripe. You will be redirected to complete your subscription.
        </p>
      </aside>
    </div>
  );
}
