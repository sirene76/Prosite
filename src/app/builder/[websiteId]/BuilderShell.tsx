"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import InspectorPanel from "@/components/builder/InspectorPanel";
import SidebarSteps from "@/components/builder/SidebarSteps";

interface BuilderShellProps {
  websiteId: string;
  children: ReactNode;
}

export default function BuilderShell({ websiteId, children }: BuilderShellProps) {
  return (
    <div className="builder-container">
      <aside className="sidebar">
        <div className="sidebar-title">Prosite</div>
        <SidebarSteps active="Branding" />
      </aside>

      <main className="main">
        <div className="top-nav mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="opacity-60">/</span>
            <Link href={`/builder/${websiteId}`} className="text-white">
              Builder
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Hello, email@gmail.com</span>
            <button type="button" className="btn-secondary">
              Sign out
            </button>
            <button type="button" className="btn-primary">
              Publish
            </button>
          </div>
        </div>
        {children}
      </main>

      <aside className="inspector">
        <InspectorPanel />
      </aside>
    </div>
  );
}
