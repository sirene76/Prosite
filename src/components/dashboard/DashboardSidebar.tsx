"use client";

import type { ComponentType, MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Globe,
  BarChart,
  Settings as SettingsIcon,
  Lock,
} from "lucide-react";

interface SidebarProps {
  websiteId: string;
  plan: "free" | "basic" | "standard" | "premium";
}

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
  requires?: "basic" | "standard" | "premium";
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Content", href: "content", icon: FileText },
  { label: "SEO", href: "seo", icon: Globe },
  {
    label: "Analytics",
    href: "analytics",
    icon: BarChart,
    requires: "standard",
    badge: "PRO",
  },
  {
    label: "Settings",
    href: "settings",
    icon: SettingsIcon,
    requires: "premium",
    badge: "PREMIUM",
  },
];

const planOrder = ["free", "basic", "standard", "premium"] as const;

type PlanOrder = (typeof planOrder)[number];

function getPlanRank(plan: PlanOrder) {
  return planOrder.indexOf(plan);
}

export function DashboardSidebar({ websiteId, plan }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const planRank = getPlanRank(plan);
  const basePath = `/dashboard/${websiteId}`;

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold text-gray-800">Prosite</h2>
        <p className="mt-1 text-xs capitalize text-gray-500">{plan} plan</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ label, href, icon: Icon, requires, badge }) => {
          const fullPath = href ? `${basePath}/${href}` : basePath;
          const isOverview = href.length === 0;
          const active = isOverview
            ? pathname === basePath || pathname === `${basePath}/`
            : pathname === fullPath || pathname.startsWith(`${fullPath}/`);

          const requiredRank = requires
            ? getPlanRank(requires as PlanOrder)
            : -1;
          const locked = requiredRank > planRank;

          return (
            <Link
              key={label}
              href={locked ? "#" : fullPath}
              aria-disabled={locked}
              tabIndex={locked ? -1 : undefined}
              onClick={locked ? (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault() : undefined}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="flex items-center gap-2">
                <Icon size={18} />
                {label}
              </span>
              {locked && (
                <span className="flex items-center gap-1 text-gray-400">
                  {badge && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                      {badge}
                    </span>
                  )}
                  <Lock size={14} />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export type { SidebarProps };
