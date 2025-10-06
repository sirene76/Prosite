"use client";

import { useState } from "react";

type Plan = "pro" | "agency";

type CheckoutResponse = {
  url?: string;
};

export function CheckoutButton({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as CheckoutResponse;
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      alert("Error starting checkout");
    } catch (error) {
      console.error("Checkout initiation failed:", error);
      alert("Error starting checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {loading ? "Redirecting..." : `Buy ${plan} plan`}
    </button>
  );
}
