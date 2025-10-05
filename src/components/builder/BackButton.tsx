"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
      aria-label="Go back to home"
    >
      <span aria-hidden>←</span>
      <span>Back</span>
    </button>
  );
}
