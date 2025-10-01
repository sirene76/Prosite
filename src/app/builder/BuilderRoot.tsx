"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BuilderProvider } from "@/context/BuilderContext";
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
  children: React.ReactNode;
};

export default function BuilderRoot({ children }: BuilderRootProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentStep = useMemo(() => {
    const index = steps.findIndex((step) => pathname.startsWith(step.href));
    return index === -1 ? 0 : index;
  }, [pathname]);

  return (
    <BuilderProvider>
      <div className="flex min-h-screen flex-col bg-builder-background text-slate-100">
        <header className="border-b border-slate-800/60 bg-builder-surface/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold">Prosite Builder</h1>
              <p className="text-sm text-slate-400">Craft a polished web presence in three guided steps.</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-300">Need help?</p>
              <p className="text-xs text-slate-500">Schedule a strategy call with our team.</p>
            </div>
          </div>
          <ProgressBar steps={steps} activeIndex={currentStep} onStepClick={(href) => router.push(href)} />
        </header>
        <main className="flex flex-1 overflow-hidden">
          <section className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-end border-b border-slate-800/60 bg-builder-surface px-6 py-3">
              <DeviceControls />
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="flex h-full flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                  <WebsitePreview />
                </div>
                <div className="border-t border-slate-800/60 bg-builder-surface/60 backdrop-blur">
                  <div className="mx-auto w-full max-w-5xl max-h-[22rem] shrink-0 overflow-y-auto px-6 py-6">
                    {children}
                  </div>
                </div>
              </div>
              <Sidebar steps={steps} currentIndex={currentStep} />
            </div>
          </section>
        </main>
      </div>
    </BuilderProvider>
  );
}
