"use client";

import "@/styles/new-builder.css";

import { useEffect, useState } from "react";
import NewBuilderShell from "@/components/NewBuilderShell";
import NewBuilderPreview from "@/components/NewBuilderPreview";
import NewInspectorPanel from "@/components/NewInspectorPanel";
import DeviceToolbar, { DeviceMode } from "@/components/DeviceToolbar";

export default function BuilderPageClient({ websiteId }: { websiteId: string }) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [data, setData] = useState({
    title: "",
    business: "",
    logo: "",
    theme: { colors: {}, fonts: {} },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        if (!websiteId || websiteId === "new") {
          console.warn("Builder opened without a valid websiteId.");
          return;
        }

        // 1️⃣ Fetch the website first
        const websiteRes = await fetch(`/api/websites/${websiteId}`);
        if (!websiteRes.ok) {
          console.error("❌ Failed to fetch website");
          return;
        }
        const website = await websiteRes.json();

        // 2️⃣ Extract the templateId from the website
        const templateId = website.templateId;
        if (!templateId) {
          console.error("❌ Website has no templateId");
          return;
        }

        // 3️⃣ Fetch the template using its ID
        const templateRes = await fetch(`/api/templates/${templateId}`);
        if (!templateRes.ok) {
          console.error("❌ Failed to fetch template");
          return;
        }
        const template = await templateRes.json();

        // 4️⃣ Apply the data
        setTemplateHtml(template.html || "");
        setData({
          title: website.branding?.title || "",
          business: website.branding?.business || "",
          logo: website.branding?.logo || "",
          theme: website.theme || { colors: {}, fonts: {} },
        });
      } catch (err) {
        console.error("Builder fetch failed:", err);
      }
    }

    fetchData();
  }, [websiteId]);

  const [activeStep, setActiveStep] = useState("template");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");

  const steps = [
    { id: "template", label: "Template" },
    { id: "branding", label: "Branding" },
    { id: "checkout", label: "Checkout" },
  ];

  return (
    <NewBuilderShell>
      <div className="builder-grid">
        <aside className="left-panel">
          <nav className="step-navigation">
            <h3>Process</h3>
            <div className="step-list">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={`step-button${activeStep === step.id ? " active" : ""}`}
                  onClick={() => setActiveStep(step.id)}
                  type="button"
                >
                  {step.label}
                  <span>Step {index + 1}</span>
                </button>
              ))}
            </div>
          </nav>

          <DeviceToolbar selectedDevice={deviceMode} onDeviceChange={setDeviceMode} />
        </aside>

        <section className="preview-panel">
          <NewBuilderPreview
            templateHtml={templateHtml}
            data={data}
            device={deviceMode}
          />
        </section>

        <aside className="inspector">
          <NewInspectorPanel data={data} setData={setData} activeStep={activeStep} />
        </aside>
      </div>
    </NewBuilderShell>
  );
}
