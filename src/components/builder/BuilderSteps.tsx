export default function BuilderSteps({ active }: { active: string }) {
  const steps = ["Template", "Branding", "Checkout"];
  return (
    <div className="step-nav">
      {steps.map((step, i) => (
        <div key={step} className={`step ${active === step ? "active" : ""}`}>
          <span>{i + 1}</span> {step}
        </div>
      ))}
    </div>
  );
}
