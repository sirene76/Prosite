"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function BuilderNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  useEffect(() => {
    async function createWebsite() {
      if (!templateId) return;

      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) {
        console.error("Failed to create website");
        return;
      }

      const website = await response.json();
      router.replace(`/builder/${website._id}`);
    }

    createWebsite();
  }, [templateId, router]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-300">
      <p>
        Creating your website from template <b>{templateId}</b>...
      </p>
    </div>
  );
}
