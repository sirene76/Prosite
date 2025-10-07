"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function BuilderNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get("template");

  useEffect(() => {
    async function createWebsite() {
      if (!templateSlug) return;

      // Create a new website entry in the DB
      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateSlug }),
      });

      if (!response.ok) {
        console.error("Failed to create website");
        return;
      }

      const website = await response.json();
      router.replace(`/builder/${website._id}`); // redirect to the actual builder page
    }

    createWebsite();
  }, [templateSlug, router]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-300">
      <p>Creating your website from template <b>{templateSlug}</b>...</p>
    </div>
  );
}
