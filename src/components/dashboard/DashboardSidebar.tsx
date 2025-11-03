"use client";

import { type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Globe,
  BarChart,
  Settings,
  Lock,
} from "lucide-react";

const plans = ["free", "basic", "standard", "premium"] as const;
export type Plan = (typeof plans)[number];

interface SidebarNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
  requires?: Plan;
}

interface SidebarProps {
  websiteId: string;
  plan: Plan;
}

const navItems: SidebarNavItem[] = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Content", href: "content", icon: FileText },
  { label: "SEO", href: "seo", icon: Globe },
  { label: "Analytics", href: "analytics", icon: BarChart, requires: "standard" },
  { label: "Settings", href: "settings", icon: Settings, requires: "premium" },
];

function getBadgeLabel(requirement?: Plan) {
  if (requirement === "standard") return "PRO";
  if (requirement === "premium") return "PREMIUM";
  return null;
}

export function DashboardSidebar({ websiteId, plan }: SidebarProps) {
  const pathname = usePathname();
  const planRank = plans.indexOf(plan);
  const basePath = `/dashboard/${websiteId}`;

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold text-gray-800">Prosite</h2>
        <p className="mt-1 text-xs capitalize text-gray-500">{plan} plan</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ label, href, icon: Icon, requires }) => {
          const fullPath = href ? `${basePath}/${href}` : basePath;
          const isActive =
            pathname === fullPath ||
            pathname === `${fullPath}/` ||
            (href !== "" && pathname.startsWith(`${fullPath}/`));

          const requiredRank = requires ? plans.indexOf(requires) : -1;
          const locked = requiredRank > planRank;
          const badge = locked ? getBadgeLabel(requires) : null;

          return (
            <Link
              key={label}
              href={locked ? "#" : fullPath}
              aria-disabled={locked}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="flex items-center gap-2">
                <Icon size={18} />
                {label}
              </span>
              {locked && (
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <Lock size={12} />
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
