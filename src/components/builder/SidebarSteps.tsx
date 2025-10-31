import { BUILDER_STEPS, getBuilderStepLabel, type BuilderStep } from "@/lib/builderSteps";

interface SidebarStepsProps {
  steps?: readonly BuilderStep[];
  activeStep?: BuilderStep;
}

export default function SidebarSteps({ steps = BUILDER_STEPS, activeStep }: SidebarStepsProps) {
  const resolvedActive = activeStep ?? steps[0];

  return (
    <nav className="step-list">
      {steps.map((step, index) => {
        const label = getBuilderStepLabel(step);
        const isActive = step === resolvedActive;

        return (
          <div key={step} className={`step${isActive ? " active" : ""}`}>
            <span className="step-index">{index + 1}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </nav>
  );
}
