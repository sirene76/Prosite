"use client";
import { useState, useEffect } from "react";
import NewBuilderShell from "@/components/NewBuilderShell";
import NewBuilderPreview from "@/components/NewBuilderPreview";
import NewInspectorPanel from "@/components/NewInspectorPanel";

export default async function BuilderPage({ params }: any) {
  const { websiteId } = await params; // ✅ unwrap the Promise here

  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [data, setData] = useState({
    title: "My Awesome Website",
    business: "Prosite Inc.",
    logo: "",
  });

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/templates/${websiteId}`);
        const template = await res.json();
        setTemplateHtml(template.html);
      } catch (e) {
        console.error("Template fetch failed:", e);
      }
    }
    fetchTemplate();
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
