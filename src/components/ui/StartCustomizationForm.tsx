"use client";

import { useTransition, useState } from "react";

export default function StartCustomizationForm({
  startCustomizing,
}: {
  startCustomizing: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async () => {
        setLoading(true);
        startTransition(async () => {
          await startCustomizing();
        });
      }}
      className="relative"
    >
      <button
        type="submit"
        disabled={isPending || loading}
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition disabled:opacity-60"
      >
        {loading ? "Redirecting to builder…" : "Start Customizing →"}
      </button>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="h-10 w-10 animate-spin text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="text-white text-sm font-medium">Redirecting to builder…</p>
          </div>
        </div>
      )}
    </form>
  );
}
