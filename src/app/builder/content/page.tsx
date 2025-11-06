"use client";

import { ContentAccordion } from "@/components/builder/ContentAccordion";
import { useBuilder } from "@/context/BuilderContext";

export default function ContentPage() {
  const { selectedTemplate } = useBuilder();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Shape your story</h2>
        <p className="text-sm text-slate-400">
          Update copy across the template. Changes sync instantly with the live preview.
        </p>
      </div>

      <ContentAccordion meta={selectedTemplate.meta} />
    </div>
  );
}
