"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function BuilderNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/builder/new${templateId ? `?template=${encodeURIComponent(templateId)}` : ""}`;
    }

    return window.location.pathname + window.location.search;
  }, [templateId]);

  useEffect(() => {
    async function createWebsite() {
      if (!templateId) {
        setError("Missing template id");
        return;
      }

      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        const message = payload?.error || "Failed to create website";
        setError(message);
        console.error(message);
        return;
      }

      const website = await response.json();
      router.replace(`/builder/${website._id}`);
    }

    createWebsite();
  }, [callbackUrl, templateId, router]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-300">
      {error ? (
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <p className="text-base font-medium text-red-300">{error}</p>
          <p className="text-sm text-slate-400">
            Please sign in and try again, or select a different template.
          </p>
        </div>
      ) : (
        <p>
          Creating your website from template <b>{templateId}</b>...
        </p>
      )}
    </div>
  );
}
