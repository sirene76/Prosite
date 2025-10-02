"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { useBuilderStore } from "@/store/builderStore";

type PlanId = "free" | "pro" | "agency";

const PLAN_PRICING: Record<PlanId, string> = {
  free: "$0",
  pro: "$29",
  agency: "$99",
};

export default function CheckoutPage() {
  const params = useParams<{ websiteId: string }>();
  const { websiteName, theme } = useBuilderStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [loading, setLoading] = useState(false);

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
        window.location.href = data.url as string;
        return;
      }

      alert((data && data.error) || "Error starting checkout");
    } catch (error) {
      console.error("Failed to start checkout", error);
      alert("Error starting checkout");
    } finally {
      setLoading(false);
    }
  };

  const resolvedWebsiteName = websiteName || params.websiteId;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-lg lg:flex-row">
        {/* Left Section: Info + Plan Selection */}
        <div className="w-full border-b p-8 lg:w-2/3 lg:border-b-0 lg:border-r">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <p className="mt-2 text-sm text-gray-500">Provide your information and select the plan that fits your project.</p>

          {/* Basic Information */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">Choose Plan</h3>
            <div className="mt-4 flex flex-wrap gap-4">
              {(["free", "pro", "agency"] as PlanId[]).map((plan) => {
                const isSelected = selectedPlan === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex-1 rounded-lg border px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-none ${
                      isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="block text-left">
                      {plan.toUpperCase()}
                      <span className="mt-1 block text-xs font-normal opacity-80">{PLAN_PRICING[plan]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method (UI Only, Stripe handles actual payment) */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
            <div className="mt-4 flex gap-6">
              <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input type="radio" name="method" defaultChecked className="h-4 w-4 text-blue-600" />
                <span>Credit Card</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input type="radio" name="method" className="h-4 w-4 text-blue-600" />
                <span>PayPal</span>
              </label>
            </div>
            <p className="mt-3 text-xs text-gray-500">Secure payment is handled by Stripe during checkout.</p>
          </div>
        </div>

        {/* Right Section: Summary */}
        <div className="flex w-full flex-col justify-between bg-gray-900 p-8 text-white lg:w-1/3">
          <div>
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="mt-6 space-y-4 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-300">Website</span>
                <span className="font-medium text-white">{resolvedWebsiteName}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">Theme</span>
                <span className="font-medium text-white">{theme ?? "Default"}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">Selected Plan</span>
                <span className="font-medium text-white">{selectedPlan.toUpperCase()}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">Subtotal</span>
                <span className="font-medium text-white">$0</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">Discount</span>
                <span className="font-medium text-white">$0</span>
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xl font-semibold">
              <span>Total</span>
              <span>{PLAN_PRICING[selectedPlan]}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Redirecting..." : "Checkout Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
