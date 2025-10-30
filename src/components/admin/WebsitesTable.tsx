"use client";

import { useState } from "react";

type WebsiteRow = {
  _id: string;
  userEmail?: string | null;
  templateId?: string | null;
  plan?: string | null;
  seo?: { score?: number | null } | null;
  status?: string | null;
};

type WebsitesTableProps = {
  sites: WebsiteRow[];
};

export default function WebsitesTable({ sites }: WebsitesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function redeploy(id: string) {
    try {
      setLoadingId(id);
      await fetch(`/api/websites/${id}/redeploy`, { method: "POST" });
      alert("Redeployed!");
    } catch (error) {
      console.error(error);
      alert("Failed to trigger redeploy");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-100">
        <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-300">
          <tr>
            <th className="border border-slate-700 px-3 py-2">Client</th>
            <th className="border border-slate-700 px-3 py-2">Template</th>
            <th className="border border-slate-700 px-3 py-2">Plan</th>
            <th className="border border-slate-700 px-3 py-2">SEO</th>
            <th className="border border-slate-700 px-3 py-2">Status</th>
            <th className="border border-slate-700 px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site._id} className="border border-slate-800">
              <td className="border border-slate-800 px-3 py-2">{site.userEmail ?? "-"}</td>
              <td className="border border-slate-800 px-3 py-2">{site.templateId ?? "-"}</td>
              <td className="border border-slate-800 px-3 py-2">{site.plan ?? "-"}</td>
              <td className="border border-slate-800 px-3 py-2">{site.seo?.score ?? "-"}</td>
              <td className="border border-slate-800 px-3 py-2 capitalize">{site.status ?? "-"}</td>
              <td className="border border-slate-800 px-3 py-2">
                <button
                  type="button"
                  onClick={() => redeploy(site._id)}
                  disabled={loadingId !== null}
                  className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingId === site._id ? "Redeploying..." : "Redeploy"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
