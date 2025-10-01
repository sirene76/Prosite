"use client";

import clsx from "clsx";

type ProgressBarProps = {
  steps: { label: string; href: string }[];
  activeIndex: number;
  onStepClick?: (href: string) => void;
};

export function ProgressBar({ steps, activeIndex, onStepClick }: ProgressBarProps) {
  return (
    <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 pb-3">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = activeIndex > index;

        return (
          <div key={step.href} className="flex flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => onStepClick?.(step.href)}
              className="group flex items-center gap-3 text-left transition-colors"
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full border transition",
                    isCompleted
                      ? "border-transparent bg-builder-accent"
                      : isActive
                        ? "border-builder-accent bg-builder-accent/30"
                        : "border-slate-700 bg-slate-800 group-hover:border-builder-accent/50"
                  )}
                />
              </span>
              <span className="flex flex-col">
                <span
                  className={clsx(
                    "text-xs font-semibold uppercase tracking-[0.25em]",
                    isActive ? "text-slate-200" : "text-slate-500 group-hover:text-slate-300"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-slate-600">Step {index + 1}</span>
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span className="hidden flex-1 border-t border-dashed border-slate-800/80 sm:block" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
