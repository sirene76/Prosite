"use client";
import { useState, useEffect } from "react";

export default function CheckoutPage({ params }: { params: { websiteId: string } }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Starting SEO optimization...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const runSEO = async () => {
      setStatus("Collecting content data...");
      setProgress(20);
      await new Promise((r) => setTimeout(r, 1000));

      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: params.websiteId }),
      });

      setStatus("Generating meta tags...");
      setProgress(60);

      if (res.ok) {
        setStatus("Finalizing SEO setup...");
        await new Promise((r) => setTimeout(r, 1000));
        setProgress(100);
        setDone(true);
      } else {
        setStatus("Failed to optimize website.");
      }
    };
    runSEO();
  }, [params.websiteId]);

  if (!done) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-2xl font-semibold mb-4">{status}</h2>
        <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-gray-500">{progress}%</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">Choose your payment plan</h2>
      {/* Existing Stripe checkout content */}
    </div>
  );
}
