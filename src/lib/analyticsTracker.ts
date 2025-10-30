import Analytics from "@/models/Analytics";

type AnalyticsPayload = Partial<{
  seoScore: number;
  visits: number;
  uniqueVisitors: number;
  date: Date;
}>;

function sanitizePayload(data: AnalyticsPayload) {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      payload[key] = value;
    }
  }

  return payload;
}

export async function recordAnalytics(siteId: string, data: AnalyticsPayload) {
  const payload = sanitizePayload(data);

  try {
    await Analytics.create({ siteId, ...payload });
  } catch (error) {
    console.warn("Failed to record analytics", error);
  }
}
