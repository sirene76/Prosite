import Analytics from "@/models/Analytics";
import { connectDB } from "@/lib/mongodb";

type AnalyticsPayload = Partial<{
  seoScore: number;
  visits: number;
  uniqueVisitors: number;
  date: Date;
  path: string;
  referrer: string;
  userAgent: string;
  ip: string;
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
  if (Object.keys(payload).length === 0) {
    return;
  }

  try {
    await connectDB();
    await Analytics.create({ siteId, ...payload });
  } catch (error) {
    console.warn("Failed to record analytics", error);
  }
}
