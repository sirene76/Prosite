import { headers } from "next/headers";

import SEOTrendChart from "@/components/charts/SEOTrendChart";
import TrafficChart from "@/components/charts/TrafficChart";

type AnalyticsEntry = {
  _id?: string;
  date?: string;
  seoScore?: number;
  visits?: number;
  uniqueVisitors?: number;
};

async function fetchAnalytics(websiteId: string) {
  const hdrs = await headers();
  const protocol = hdrs.get("x-forwarded-proto") || "http";
  const host = hdrs.get("host");
  const cookie = hdrs.get("cookie") || "";

  if (!host) {
    return [] as AnalyticsEntry[];
  }

  const baseUrl = `${protocol}://${host}`;
  const response = await fetch(`${baseUrl}/api/analytics/${websiteId}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });

  if (!response.ok) {
    return [] as AnalyticsEntry[];
  }

  const rawData = await response.json();
  if (!Array.isArray(rawData)) {
    return [] as AnalyticsEntry[];
  }

  return rawData as AnalyticsEntry[];
}

function normalizeData(entries: AnalyticsEntry[]) {
  return entries.map((entry) => {
    const normalizedDate = entry.date
      ? new Date(entry.date).toISOString()
      : new Date().toISOString();

    return {
      ...entry,
      date: normalizedDate,
      seoScore: typeof entry.seoScore === "number" ? entry.seoScore : 0,
      visits: typeof entry.visits === "number" ? entry.visits : 0,
      uniqueVisitors:
        typeof entry.uniqueVisitors === "number" ? entry.uniqueVisitors : 0,
    };
  });
}

function computeSummary(entries: AnalyticsEntry[]) {
  if (entries.length === 0) {
    return {
      latestScore: null as number | null,
      averageScore: null as number | null,
      totalVisits: 0,
      totalUniqueVisitors: 0,
    };
  }

  const latest = entries[entries.length - 1];
  const totals = entries.reduce<{
    scoreTotal: number;
    visitsTotal: number;
    uniqueTotal: number;
  }>((acc, entry) => {
      acc.scoreTotal += typeof entry.seoScore === "number" ? entry.seoScore : 0;
      acc.visitsTotal += typeof entry.visits === "number" ? entry.visits : 0;
      acc.uniqueTotal +=
        typeof entry.uniqueVisitors === "number" ? entry.uniqueVisitors : 0;
      return acc;
    }, { scoreTotal: 0, visitsTotal: 0, uniqueTotal: 0 });

  return {
    latestScore:
      typeof latest.seoScore === "number" ? Math.round(latest.seoScore) : null,
    averageScore:
      entries.length > 0 ? Math.round(totals.scoreTotal / entries.length) : null,
    totalVisits: totals.visitsTotal,
    totalUniqueVisitors: totals.uniqueTotal,
  };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const analytics = await fetchAnalytics(websiteId);
  const data = normalizeData(analytics);
  const summary = computeSummary(analytics);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">📈 Analytics Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="text-gray-500">Latest SEO score</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {typeof summary.latestScore === "number"
              ? `${summary.latestScore} / 100`
              : "No data"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="text-gray-500">Average SEO score (30d)</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {typeof summary.averageScore === "number"
              ? `${summary.averageScore} / 100`
              : "No data"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="text-gray-500">Visits (30d)</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summary.totalVisits.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="text-gray-500">Unique visitors (30d)</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {summary.totalUniqueVisitors.toLocaleString()}
          </p>
        </div>
      </div>
      {data.length > 0 ? (
        <>
          <SEOTrendChart data={data} />
          <TrafficChart data={data} />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No analytics available yet. Run an SEO scan or start receiving traffic to
          populate this dashboard.
        </div>
      )}
    </div>
  );
}
