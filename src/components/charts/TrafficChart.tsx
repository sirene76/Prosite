"use client";

import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type TrafficChartInput = {
  date?: string;
  chartLabel?: string;
  visits?: number | null;
  uniqueVisitors?: number | null;
};

type TrafficChartDatum = {
  date: string;
  chartLabel: string;
  visits: number;
  uniqueVisitors: number;
};

type TrafficChartProps = {
  data: TrafficChartInput[];
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

export default function TrafficChart({ data }: TrafficChartProps) {
  const safeData: TrafficChartDatum[] = Array.isArray(data)
    ? data.map((entry) => {
        const isoDate =
          typeof entry.date === "string" && entry.date.length > 0
            ? entry.date
            : new Date().toISOString();

        return {
          date: isoDate,
          chartLabel: ensureChartLabel(isoDate, entry.chartLabel),
          visits: typeof entry.visits === "number" ? entry.visits : 0,
          uniqueVisitors:
            typeof entry.uniqueVisitors === "number" ? entry.uniqueVisitors : 0,
        } satisfies TrafficChartDatum;
      })
    : [];

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Traffic (Visits per Day)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="chartLabel" />
          <YAxis allowDecimals={false} />
          <Tooltip
            labelFormatter={(label, payload) => {
              const datum = payload?.[0]?.payload as
                | TrafficChartDatum
                | undefined;
              const fallback =
                typeof label === "string"
                  ? label
                  : datum?.chartLabel ?? "";
              return formatTooltipLabel(datum?.date, fallback);
            }}
          />
          <Legend />
          <Bar
            name="Visits"
            dataKey="visits"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
          <Line
            type="monotone"
            name="Unique visitors"
            dataKey="uniqueVisitors"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
