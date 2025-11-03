"use client";

import Link from "next/link";
import { useState } from "react";

export function SEOInsights({
  websiteId,
  initialScore,
  initialLastScan,
}: {
  websiteId: string;
  initialScore: number | null;
  initialLastScan: string | null;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [lastScan, setLastScan] = useState<string | null>(initialLastScan);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/seo/${websiteId}/scan`);
      const data = await res.json();

      if (res.ok) {
        setScore(data.score ?? null);
        setLastScan(data.lastScan ?? null);
        setSuggestions(data.suggestions ?? []);
      } else {
        setError(data.error || "Failed to run scan");
      }
    } catch {
      setError("Network error during SEO scan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="seo-insights" className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        SEO insights
      </h2>

      <p className="mt-3 text-lg font-semibold text-gray-900">
        {typeof score === "number" ? `${Math.round(score)} / 100` : "No data"}
      </p>

      {lastScan ? (
        <p className="mt-2 text-sm text-gray-400">
          Last scan {new Date(lastScan).toLocaleString()}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-400">Scan not yet run</p>
      )}

      <button
        onClick={handleScan}
        disabled={loading}
        className={`mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-500"
        }`}
      >
        {loading ? "Scanning..." : "Run SEO Scan"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {suggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/dashboard/${websiteId}/analytics`}
        className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-500"
      >
        View Analytics →
      </Link>
    </div>
  );
}
