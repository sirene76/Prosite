import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

const allowedPlans = ["free", "basic", "standard", "premium"] as const;
type Plan = (typeof allowedPlans)[number];

function normalizePlan(value: unknown): Plan {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if ((allowedPlans as readonly string[]).includes(normalized)) {
      return normalized as Plan;
    }
  }
  return "free";
}

interface DashboardLayoutProps {
  children: ReactNode;
  params: { websiteId: string };
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { websiteId } = params;

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
