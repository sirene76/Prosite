"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type SEOTrendChartProps = {
  data: Array<{
    date: string;
    seoScore?: number | null;
  }>;
};

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function SEOTrendChart({ data }: SEOTrendChartProps) {
  const safeData = Array.isArray(data)
    ? data.map((entry) => ({
        ...entry,
        seoScore:
          typeof entry.seoScore === "number" ? Math.round(entry.seoScore) : 0,
      }))
    : [];

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">SEO Score Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} />
          <YAxis domain={[0, 100]} allowDecimals={false} tickCount={6} />
          <Tooltip
            formatter={(value: unknown) => value}
            labelFormatter={formatDateLabel}
          />
          <Line type="monotone" dataKey="seoScore" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
