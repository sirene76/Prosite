"use client";

import clsx from "clsx";

type ProgressBarProps = {
  steps: { label: string; href: string }[];
  activeIndex: number;
  onStepClick?: (href: string) => void;
};

export function ProgressBar({ steps, activeIndex, onStepClick }: ProgressBarProps) {
  return (
    <nav className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 pb-4">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = activeIndex > index;

        return (
          <button
            type="button"
            key={step.href}
            onClick={() => onStepClick?.(step.href)}
            className="group flex flex-1 items-center gap-3 text-left"
          >
            <span
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition",
                isCompleted && "border-builder-accent bg-builder-accent/20 text-builder-accent",
                isActive && !isCompleted && "border-builder-accent bg-builder-accent/20 text-builder-accent",
                !isActive && !isCompleted && "border-slate-700/80 text-slate-500 group-hover:border-builder-accent/40"
              )}
            >
              {isCompleted ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.043 7.11a1 1 0 0 1-1.433.019L3.29 8.947a1 1 0 0 1 1.42-1.406l4.2 4.245 6.333-6.392a1 1 0 0 1 1.414-.006z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </span>
            <span className="flex flex-col">
              <span
                className={clsx(
                  "text-sm font-semibold uppercase tracking-wide",
                  isActive ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300"
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-slate-500">Step {index + 1}</span>
            </span>
            {index < steps.length - 1 ? (
              <span className="hidden flex-1 border-t border-dashed border-slate-800/80 md:block" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
