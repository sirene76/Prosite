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

type TrafficChartProps = {
  data: Array<{
    date: string;
    visits?: number | null;
    uniqueVisitors?: number | null;
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

export default function TrafficChart({ data }: TrafficChartProps) {
  const safeData = Array.isArray(data)
    ? data.map((entry) => ({
        ...entry,
        visits: typeof entry.visits === "number" ? entry.visits : 0,
        uniqueVisitors:
          typeof entry.uniqueVisitors === "number" ? entry.uniqueVisitors : 0,
      }))
    : [];

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Traffic (Visits per Day)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={safeData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} />
          <YAxis allowDecimals={false} />
          <Tooltip labelFormatter={formatDateLabel} />
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
