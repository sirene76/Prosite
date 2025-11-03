"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faFileLines,
  faGlobe,
  faSliders,
  faLock,
  faGaugeHigh,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const plans = ["free", "basic", "standard", "premium"] as const;
export type Plan = (typeof plans)[number];

interface SidebarNavItem {
  label: string;
  href: string;
  icon: any;
  requires?: Plan;
}

interface SidebarProps {
  websiteId: string;
  plan: Plan;
}

const navItems: SidebarNavItem[] = [
  { label: "Overview", href: "", icon: faGaugeHigh },
  { label: "Content", href: "content", icon: faFileLines },
  { label: "SEO", href: "seo", icon: faGlobe },
  { label: "Analytics", href: "analytics", icon: faChartBar, requires: "standard" },
  { label: "Settings", href: "settings", icon: faSliders, requires: "premium" },
];

function getBadgeLabel(requirement?: Plan) {
  if (requirement === "standard") return "PRO";
  if (requirement === "premium") return "PREMIUM";
  return null;
}

export function DashboardSidebar({ websiteId, plan }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const planRank = plans.indexOf(plan);
  const basePath = `/dashboard/${websiteId}`;

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* ---- Mobile Header ---- */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Prosite</h2>
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-md p-2 hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
        </button>
      </div>

      {/* ---- Sidebar (responsive) ---- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-gray-800">Prosite</h2>
          <p className="mt-1 text-xs capitalize text-gray-500">{plan} plan</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ label, href, icon, requires }) => {
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
                onClick={() => setIsOpen(false)} // close sidebar on mobile
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={icon} size="sm" />
                  {label}
                </span>

                {locked && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <FontAwesomeIcon icon={faLock} size="xs" />
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ---- Overlay (mobile only) ---- */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
