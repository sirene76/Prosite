"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { useBuilder } from "@/context/BuilderContext";

type PlanId = "free" | "pro" | "agency";

export default function CheckoutPage() {
  const params = useParams<{ websiteId?: string }>();
  const { content, selectedTemplate } = useBuilder();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [loading, setLoading] = useState(false);

  const websiteName =
    content.siteName?.trim() ||
    content.websiteName?.trim() ||
    content.businessName?.trim() ||
    content.name?.trim() ||
    params?.websiteId?.toString() ||
    selectedTemplate.name;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error ?? "Error starting checkout");
      }
    } catch (error) {
      console.error("Failed to start checkout", error);
      alert("Error starting checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-gray-950 px-6 py-12 text-slate-100">
      <h1 className="text-3xl font-bold">Review &amp; Checkout</h1>

      <div className="w-full max-w-lg rounded-lg border border-gray-900/70 bg-gray-900/40 p-6">
        <p>
          <strong>Website:</strong> {websiteName}
        </p>
        <p>
          <strong>Theme:</strong> {selectedTemplate.name ?? "Default"}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {["free", "pro", "agency"].map((plan) => (
          <button
            key={plan}
            onClick={() => setSelectedPlan(plan as PlanId)}
            className={`rounded-lg border px-6 py-3 transition ${
              selectedPlan === plan
                ? "border-builder-accent bg-builder-accent text-slate-950"
                : "border-gray-800 bg-gray-950 hover:border-builder-accent/60"
            }`}
          >
            {plan.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="rounded-lg bg-green-600 px-6 py-3 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirecting..." : `Pay for ${selectedPlan} plan`}
      </button>
    </div>
  );
}
