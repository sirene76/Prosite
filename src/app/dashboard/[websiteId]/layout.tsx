import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

const supportedPlans = ["free", "basic", "standard", "premium"] as const;
type SidebarPlan = (typeof supportedPlans)[number];

function normalizePlan(value: unknown): SidebarPlan {
  if (typeof value !== "string") {
    return "free";
  }

  const normalized = value.toLowerCase();
  return supportedPlans.includes(normalized as SidebarPlan)
    ? (normalized as SidebarPlan)
    : "free";
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ websiteId: string }> | { websiteId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const { websiteId } = resolvedParams;

  if (!websiteId || !isValidObjectId(websiteId)) {
    notFound();
  }

  await connectDB();
  const website = await Website.findById(websiteId).lean();

  if (!website) {
    notFound();
  }

  const plan = normalizePlan(website.plan);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar websiteId={websiteId} plan={plan} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
