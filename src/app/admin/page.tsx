import Link from "next/link";

import AdminStatsCards from "@/components/admin/AdminStatsCards";
import { getAdminMetrics } from "@/lib/adminMetrics";

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Monitor key performance metrics across all client websites.
          </p>
        </div>
        <Link
          href="/admin/websites"
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Manage Websites
        </Link>
      </div>

      <div className="mt-8">
        <AdminStatsCards metrics={metrics} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-900 p-4 text-slate-200">
          <p className="text-sm text-slate-400">Preview Sites</p>
          <p className="text-2xl font-semibold text-white">{metrics.previewSites}</p>
        </div>
        <div className="rounded border border-slate-800 bg-slate-900 p-4 text-slate-200">
          <p className="text-sm text-slate-400">Active Sites</p>
          <p className="text-2xl font-semibold text-white">{metrics.activeSites}</p>
        </div>
      </div>
    </section>
  );
}
