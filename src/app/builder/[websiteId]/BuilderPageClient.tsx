"use client";

import { useEffect, useState } from "react";
import NewBuilderShell from "@/components/NewBuilderShell";
import NewBuilderPreview from "@/components/NewBuilderPreview";
import NewInspectorPanel from "@/components/NewInspectorPanel";

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

  return (
    <NewBuilderShell>
      <main className="main">
        <NewBuilderPreview templateHtml={templateHtml} data={data} />
      </main>
      <aside className="inspector">
        <NewInspectorPanel data={data} setData={setData} />
      </aside>
    </NewBuilderShell>
  );
}
