"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BuilderProvider, useBuilder } from "@/context/BuilderContext";
import { ProgressBar } from "@/components/builder/ProgressBar";
import { DeviceControls } from "@/components/builder/DeviceControls";
import { Sidebar } from "@/components/builder/Sidebar";
import { WebsitePreview } from "@/components/builder/WebsitePreview";

const steps = [
  { label: "Theme", href: "/builder/theme" },
  { label: "Content", href: "/builder/content" },
  { label: "Checkout", href: "/builder/checkout" }
];

type BuilderRootProps = {
  children: ReactNode;
};

export default function BuilderRoot({ children }: BuilderRootProps) {
  return (
    <BuilderProvider>
      <BuilderLayout steps={steps}>{children}</BuilderLayout>
    </BuilderProvider>
  );
}

type BuilderLayoutProps = {
  steps: typeof steps;
  children: ReactNode;
};

function BuilderLayout({ steps, children }: BuilderLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed } = useBuilder();

  const currentStep = useMemo(() => {
    const index = steps.findIndex((step) => pathname.startsWith(step.href));
    return index === -1 ? 0 : index;
  }, [pathname, steps]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-slate-100">
      <header className="border-b border-gray-900/70 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="text-slate-200">Prosite Builder</span>
            <span className="hidden text-slate-600 sm:inline">Theme • Content • Checkout</span>
          </div>
          <DeviceControls />
        </div>
        <ProgressBar steps={steps} activeIndex={currentStep} onStepClick={(href) => router.push(href)} />
      </header>
      <main className="flex flex-1 overflow-hidden">
        <section
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
          style={{ flexBasis: isSidebarCollapsed ? "100%" : "auto" }}
        >
          <WebsitePreview />
        </section>
        <Sidebar steps={steps} currentIndex={currentStep} />
      </main>
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  );
}
