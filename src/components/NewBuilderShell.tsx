"use client";

import type { ReactNode } from "react";

type BuilderStep = {
  id: string;
  label: string;
};

type NewBuilderShellProps = {
  children: ReactNode;
  steps?: BuilderStep[];
  activeStep?: string;
  onStepChange?: (stepId: string) => void;
};

export default function NewBuilderShell({
  children,
  steps = [],
  activeStep,
  onStepChange,
}: NewBuilderShellProps) {
  return (
    <div className="builder-container">
      <header className="top-nav">
        <div className="left-nav">
          <div className="logo">Prosite</div>
          {steps.length > 0 && (
            <nav className="step-nav-horizontal" aria-label="Builder steps">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  className={`step-nav-item${
                    activeStep === step.id ? " active" : ""
                  }`}
                  onClick={() => onStepChange?.(step.id)}
                  aria-current={activeStep === step.id ? "step" : undefined}
                >
                  <span className="step-pill">{index + 1}</span>
                  <span className="step-label">{step.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="builder-body">{children}</div>
    </div>
  );
}
