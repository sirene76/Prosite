"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type SEOTrendChartInput = {
  date?: string;
  chartLabel?: string;
  seoScore?: number | null;
};

type SEOTrendChartDatum = {
  date: string;
  chartLabel: string;
  seoScore: number;
};

type SEOTrendChartProps = {
  data: SEOTrendChartInput[];
};

function formatTooltipLabel(dateIso: string | undefined, fallback: string) {
  if (!dateIso) {
    return fallback;
  }

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ensureChartLabel(isoDate: string, existingLabel?: string) {
  if (existingLabel && existingLabel.trim().length > 0) {
    return existingLabel;
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return existingLabel ?? isoDate;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function SEOTrendChart({ data }: SEOTrendChartProps) {
  const safeData: SEOTrendChartDatum[] = Array.isArray(data)
    ? data.map((entry) => {
        const isoDate =
          typeof entry.date === "string" && entry.date.length > 0
            ? entry.date
            : new Date().toISOString();

        return {
          date: isoDate,
          chartLabel: ensureChartLabel(isoDate, entry.chartLabel),
          seoScore:
            typeof entry.seoScore === "number"
              ? Math.round(entry.seoScore)
              : 0,
        } satisfies SEOTrendChartDatum;
      })
    : [];

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">SEO Score Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="chartLabel" />
          <YAxis domain={[0, 100]} allowDecimals={false} tickCount={6} />
          <Tooltip
            formatter={(value: unknown) => value}
            labelFormatter={(label, payload) => {
              const datum = payload?.[0]?.payload as
                | SEOTrendChartDatum
                | undefined;
              const fallback =
                typeof label === "string"
                  ? label
                  : datum?.chartLabel ?? "";
              return formatTooltipLabel(datum?.date, fallback);
            }}
          />
          <Legend />
          <Line
            type="monotone"
            name="SEO score"
            dataKey="seoScore"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
