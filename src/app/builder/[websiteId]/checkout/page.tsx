"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function CheckoutPage() {
  const params = useParams<{ websiteId: string }>();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "pro" }), // TODO: make dynamic
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Redirects to Stripe Checkout
    } else {
      alert("Error starting checkout");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <p className="mb-4">
        You are about to purchase the <strong>Pro plan</strong> for your site{" "}
        <span className="text-blue-500">{params.websiteId}</span>.
      </p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Redirecting..." : "Proceed to Stripe Checkout"}
      </button>
    </div>
  );
}
