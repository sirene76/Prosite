"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBuilder } from "@/context/BuilderContext";

type Plan = "export" | "agency";

export default function CheckoutPage() {
  const { selectedTemplate } = useBuilder();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const websiteId = searchParams.get("websiteId");
  const plan: Plan = searchParams.get("plan") === "export" ? "export" : "agency";

  const handleCheckout = async () => {
    if (!websiteId) {
      setError("Missing website reference. Please return to the dashboard and try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, plan }),
      });

      if (!response.ok) {
        throw new Error("Unable to initialize checkout");
      }

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unexpected error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Launch on your terms</h2>
        <p className="text-sm text-slate-400">
          Subscribe to unlock hosting, analytics, and ongoing support. Upgrade with additional templates anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6">
          <h3 className="text-lg font-semibold">Plan summary</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-center justify-between">
              <span>Template</span>
              <span className="font-medium text-slate-100">{selectedTemplate.name}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Hosting &amp; support</span>
              <span className="font-medium text-slate-100">$29/mo</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Template upgrades</span>
              <span className="font-medium text-slate-100">From $149</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6">
          <h3 className="text-lg font-semibold">Before you publish</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Download assets or sync with your domain post-checkout.</li>
            <li>Invite collaborators and manage permissions in your dashboard.</li>
            <li>Schedule onboarding with our success team.</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">Launch your site</p>
          <p className="text-xs text-slate-500">Secure checkout powered by Stripe.</p>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isProcessing}
          className="inline-flex items-center justify-center rounded-full bg-builder-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? "Preparing checkout..." : "Proceed to Stripe"}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
