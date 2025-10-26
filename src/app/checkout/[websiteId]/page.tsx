"use client";
import React, { useState, useEffect, use } from "react";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Starting SEO optimization...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const runSEO = async () => {
      try {
        setStatus("Collecting content data...");
        setProgress(20);
        await new Promise((r) => setTimeout(r, 800));

        const res = await fetch("/api/seo/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId }),
        });

        setStatus("Generating meta tags and sitemap...");
        setProgress(60);

        if (res.ok) {
          setStatus("Finalizing SEO setup...");
          await new Promise((r) => setTimeout(r, 800));
          setProgress(100);
          setDone(true);
        } else {
          const { error } = await res.json();
          console.error("SEO generation failed:", error);
          setStatus("Failed to optimize website.");
        }
      } catch (err: any) {
        console.error("SEO generation error:", err);
        setStatus("Unexpected error during SEO generation.");
      }
    };

    runSEO();
  }, [websiteId]);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Choose your payment plan
        </h2>
        <CheckoutClient websiteId={websiteId} />
      </div>
    </div>
  );
}
