interface SidebarStepsProps {
  active?: string;
}

export default function SidebarSteps({ active }: SidebarStepsProps) {
  const steps = ["Template", "Branding", "Checkout"] as const;

  return (
    <nav className="space-y-4">
      {steps.map((step, index) => {
        const isActive = step === active;

        return (
          <div key={step} className={`step${isActive ? " active" : ""}`}>
            <span className="step-index">{index + 1}</span>
            <span>{step}</span>
          </div>
        );
      })}
    </nav>
  );
}
