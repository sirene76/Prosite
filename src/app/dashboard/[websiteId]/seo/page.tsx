import React from "react";

export default async function DashboardSeoPage({ params }: { params: { websiteId: string } }) {
  const res = await fetch(`/api/seo/${params.websiteId}/scan`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">SEO Insights</h2>
      <p>
        <strong>Score:</strong> {data.score ?? 0} / 100
      </p>
      <p>
        <strong>Last Scan:</strong>{" "}
        {data.lastScan ? new Date(data.lastScan).toLocaleString() : "Not yet scanned"}
      </p>

      {data.suggestions?.length ? (
        <ul className="list-disc ml-5">
          {data.suggestions.map((s: string) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : (
        <p>No suggestions yet.</p>
      )}

      <form action={`/api/seo/${params.websiteId}/scan`} method="get">
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run New Scan
        </button>
      </form>
    </div>
  );
}
