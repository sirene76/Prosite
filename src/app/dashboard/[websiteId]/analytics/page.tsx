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

type NormalizedAnalyticsEntry = {
  id: string;
  date: string;
  chartLabel: string;
  seoScore: number;
  visits: number;
  uniqueVisitors: number;
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

function createChartLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizeData(entries: AnalyticsEntry[]): NormalizedAnalyticsEntry[] {
  return entries
    .map((entry, index) => {
      const rawDate = entry.date ? new Date(entry.date) : new Date();
      const validDate = Number.isNaN(rawDate.getTime()) ? new Date() : rawDate;
      const isoDate = validDate.toISOString();
      const chartLabel = createChartLabel(validDate);

      return {
        id: entry._id ? String(entry._id) : `${isoDate}-${index}`,
        date: isoDate,
        chartLabel,
        seoScore:
          typeof entry.seoScore === "number" ? Math.round(entry.seoScore) : 0,
        visits: typeof entry.visits === "number" ? entry.visits : 0,
        uniqueVisitors:
          typeof entry.uniqueVisitors === "number" ? entry.uniqueVisitors : 0,
      } satisfies NormalizedAnalyticsEntry;
    })
    .sort(
      (a, b) => new Date(a.date).valueOf() - new Date(b.date).valueOf(),
    );
}

function formatRangeLabel(startIso: string, endIso: string) {
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startFormatter.format(startDate)} – ${endFormatter.format(
    endDate,
  )}`;
}

function computeSummary(entries: NormalizedAnalyticsEntry[]) {
  if (entries.length === 0) {
    return {
      latestScore: null as number | null,
      averageScore: null as number | null,
      totalVisits: 0,
      totalUniqueVisitors: 0,
      rangeLabel: null as string | null,
    };
  }

  const latest = entries[entries.length - 1];
  const totals = entries.reduce(
    (acc, entry) => {
      acc.scoreTotal += entry.seoScore;
      acc.visitsTotal += entry.visits;
      acc.uniqueTotal += entry.uniqueVisitors;
      return acc;
    },
    { scoreTotal: 0, visitsTotal: 0, uniqueTotal: 0 },
  );

  return {
    latestScore: Math.round(latest.seoScore),
    averageScore:
      entries.length > 0 ? Math.round(totals.scoreTotal / entries.length) : null,
    totalVisits: totals.visitsTotal,
    totalUniqueVisitors: totals.uniqueTotal,
    rangeLabel: formatRangeLabel(entries[0].date, latest.date),
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
  const summary = computeSummary(data);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">📈 Analytics Overview</h2>
        {summary.rangeLabel && (
          <p className="mt-2 text-sm text-gray-500">
            Showing analytics for {summary.rangeLabel}
          </p>
        )}
      </div>
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
