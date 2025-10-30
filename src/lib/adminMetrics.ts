import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

const PLAN_REVENUE: Record<string, number> = {
  Free: 0,
  Pro: 49,
  Agency: 199,
};

export interface AdminMetrics {
  totalSites: number;
  activeSites: number;
  previewSites: number;
  avgSEO: number;
  revenue: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  await connectDB();

  const [totalSites, activeSites, previewSites] = await Promise.all([
    Website.countDocuments({}),
    Website.countDocuments({ status: "active" }),
    Website.countDocuments({ status: "preview" }),
  ]);

  const seoAggregation = await Website.aggregate<{ avgSEO: number }>([
    {
      $group: {
        _id: null,
        avgSEO: { $avg: { $ifNull: ["$seo.score", 0] } },
      },
    },
  ]);

  const planAggregation = await Website.aggregate<{ _id: string; count: number }>([
    {
      $group: {
        _id: "$plan",
        count: { $sum: 1 },
      },
    },
  ]);

  const avgSEO = seoAggregation[0]?.avgSEO ?? 0;

  const revenue = planAggregation.reduce((sum, plan) => {
    const planRevenue = PLAN_REVENUE[plan._id] ?? 0;
    return sum + planRevenue * plan.count;
  }, 0);

  return {
    totalSites,
    activeSites,
    previewSites,
    avgSEO: Math.round(avgSEO),
    revenue,
  };
}
