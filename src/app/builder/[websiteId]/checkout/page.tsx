"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useParams } from "next/navigation";

import { useBuilder } from "@/context/BuilderContext";

const PLAN_OPTIONS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0/mo",
    description: "Perfect for testing ideas and exploring the builder.",
    features: ["Access to core blocks", "Basic theme controls", "Community support"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$29/mo",
    description: "Everything you need to launch a polished site with confidence.",
    features: ["All Free features", "Advanced themes", "Form submissions", "Email support"],
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: "$99/mo",
    description: "Built for teams shipping multiple client projects every month.",
    features: ["All Pro features", "Multi-site management", "Client permissions", "Priority support"],
  },
];

function formatTokenLabel(token: string) {
  return token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

type PlanId = (typeof PLAN_OPTIONS)[number]["id"];

export default function BuilderCheckoutPage() {
  const params = useParams<{ websiteId?: string }>();
  const { content, selectedTemplate, theme, themeDefaults } = useBuilder();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const websiteName =
    content.siteName?.trim() ||
    content.websiteName?.trim() ||
    content.businessName?.trim() ||
    content.name?.trim() ||
    params?.websiteId?.toString() ||
    selectedTemplate.name;

  const appliedColors = useMemo(() => {
    return (selectedTemplate.colors ?? []).map((color) => {
      const value = theme.colors[color.id] ?? themeDefaults.colors[color.id] ?? color.default ?? "#0f172a";
      return {
        id: color.id,
        label: color.label ?? formatTokenLabel(color.id),
        value,
      };
    });
  }, [selectedTemplate.colors, theme.colors, themeDefaults.colors]);

  const appliedFonts = useMemo(() => {
    return (selectedTemplate.fonts ?? []).map((fontId) => ({
      id: fontId,
      label: formatTokenLabel(fontId),
      value: theme.fonts[fontId] ?? themeDefaults.fonts[fontId] ?? '"Inter", sans-serif',
    }));
  }, [selectedTemplate.fonts, theme.fonts, themeDefaults.fonts]);

  const handlePlanSelection = (plan: PlanId) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to start checkout" }));
        throw new Error(data.error ?? "Unable to start checkout");
      }

      const data = (await response.json()) as { url?: string };

      if (!data.url) {
        throw new Error("Checkout session was created without a redirect URL.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 text-slate-100">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Checkout</p>
        <h1 className="text-3xl font-semibold text-white">Review your build</h1>
        <p className="text-sm text-slate-400">Confirm your website details and choose the plan that fits your workflow.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6 rounded-3xl border border-gray-900/60 bg-gray-950/50 p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Website summary</h2>
            <p className="text-sm text-slate-400">Make sure everything looks right before heading to payment.</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-900/70 bg-gray-900/60 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Website name</p>
              <p className="mt-2 text-lg font-semibold text-white">{websiteName}</p>
            </div>

            {appliedColors.length ? (
              <div className="rounded-2xl border border-gray-900/70 bg-gray-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Theme colors</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {appliedColors.map((color) => (
                    <div key={color.id} className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-full border border-white/10" style={{ backgroundColor: color.value }} />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{color.label}</span>
                        <span className="text-sm text-slate-200">{color.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {appliedFonts.length ? (
              <div className="rounded-2xl border border-gray-900/70 bg-gray-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Typography</p>
                <div className="mt-4 space-y-3">
                  {appliedFonts.map((font) => (
                    <div key={font.id} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{font.label}</span>
                      <span className="text-sm text-slate-200">{font.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Choose your plan</h2>
            <p className="text-sm text-slate-400">Upgrade anytime. You can switch plans from your dashboard later.</p>
          </div>

          <div className="space-y-4">
            {PLAN_OPTIONS.map((plan) => {
              const isActive = plan.id === selectedPlan;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handlePlanSelection(plan.id)}
                  className={clsx(
                    "w-full rounded-3xl border px-5 py-4 text-left transition focus:outline-none",
                    isActive
                      ? "border-builder-accent/80 bg-builder-accent/10 shadow-[0_16px_45px_-24px_rgba(14,165,233,0.6)]"
                      : "border-gray-900/60 bg-gray-950/40 hover:border-builder-accent/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{plan.name}</p>
                      <p className="text-2xl font-semibold text-white">{plan.price}</p>
                      <p className="text-sm text-slate-400">{plan.description}</p>
                    </div>
                    {isActive ? (
                      <span className="rounded-full bg-builder-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-builder-accent">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-builder-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="mt-auto rounded-full bg-builder-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Preparing checkout..." : "Proceed to payment"}
          </button>
        </section>
      </div>
    </div>
  );
}
