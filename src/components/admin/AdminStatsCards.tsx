"use client";

import type { AdminMetrics } from "@/lib/adminMetrics";

type AdminStatsCardsProps = {
  metrics: Pick<AdminMetrics, "totalSites" | "activeSites" | "avgSEO" | "revenue">;
};

export default function AdminStatsCards({ metrics }: AdminStatsCardsProps) {
  const items = [
    { label: "Total Sites", value: metrics.totalSites },
    { label: "Active Sites", value: metrics.activeSites },
    { label: "Avg SEO Score", value: metrics.avgSEO },
    { label: "Monthly Revenue ($)", value: metrics.revenue },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded bg-white p-4 text-center text-slate-900 shadow">
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-2xl font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
