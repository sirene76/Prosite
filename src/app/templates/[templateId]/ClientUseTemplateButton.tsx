"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientUseTemplateButton({
  templateId,
}: {
  templateId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUseTemplate() {
    setLoading(true);
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!res.ok) {
        alert("Failed to create website draft");
        return;
      }

      const website = await res.json();

      // ✅ Redirect to the real builder
      router.push(`/builder/${website._id}`);
    } catch (error) {
      console.error("Error creating website:", error);
      alert("An error occurred while starting the builder.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUseTemplate}
      disabled={loading}
      className={`px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-medium ${
        loading ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Creating your builder..." : "Use this Template"}
    </button>
  );
}
