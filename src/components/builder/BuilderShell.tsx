"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import InspectorPanel from "@/components/builder/InspectorPanel";
import SidebarSteps from "@/components/builder/SidebarSteps";
import { BUILDER_STEPS, getActiveBuilderStep } from "@/lib/builderSteps";

interface BuilderShellProps {
  websiteId: string;
  children: ReactNode;
}

export default function BuilderShell({ websiteId, children }: BuilderShellProps) {
  const pathname = usePathname();
  const activeStep = getActiveBuilderStep(pathname) ?? BUILDER_STEPS[1];

  return (
    <div className="builder-ui">
      <header className="top-nav">
        <div className="top-nav-left">
          <div className="breadcrumbs">
            <Link href="/dashboard" className="breadcrumb-link">
              Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link href={`/builder/${websiteId}`} className="breadcrumb-current">
              Builder
            </Link>
          </div>
          <SidebarSteps steps={BUILDER_STEPS} activeStep={activeStep} />
        </div>
        <div className="top-nav-actions">
          <span className="user-email">Hello, email@gmail.com</span>
          <button type="button" className="btn-secondary">
            Sign out
          </button>
          <button type="button" className="btn-primary">
            Publish
          </button>
        </div>
      </header>
      <div className="builder-container">
        <main className="main">{children}</main>
        <aside className="inspector">
          <InspectorPanel />
        </aside>
      </div>
    </div>
  );
}
