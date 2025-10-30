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

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const analytics = await fetchAnalytics(websiteId);
  const data = normalizeData(analytics);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">📈 Analytics Overview</h2>
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
