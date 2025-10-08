"use client";

import { useBuilder } from "@/context/BuilderContext";

const contentFields: { key: string; label: string; helper?: string; type?: "textarea" | "email" }[] = [
  { key: "name", label: "Headline", helper: "Displayed in the hero section." },
  { key: "tagline", label: "Tagline", helper: "A short phrase summarizing your value." },
  { key: "about", label: "About", helper: "Appears in the about section.", type: "textarea" },
  { key: "resumeTitle", label: "Resume Section Title" },
  { key: "resumeSummary", label: "Resume Summary", type: "textarea" },
  { key: "portfolioHeading", label: "Portfolio Heading" },
  { key: "testimonialQuote", label: "Testimonial Quote", type: "textarea" },
  { key: "testimonialAuthor", label: "Testimonial Author" },
  { key: "contactHeadline", label: "Contact Headline" },
  { key: "contactEmail", label: "Contact Email", type: "email" }
];

export default function ContentPage() {
  const { content, updateContent } = useBuilder();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Shape your story</h2>
        <p className="text-sm text-slate-400">
          Update copy across the template. Changes sync instantly with the live preview.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {contentFields.map(({ key, label, helper, type }) => (
          <label key={key} className="flex flex-col space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-300">
              <span>{label}</span>
              {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
            </div>
            {type === "textarea" ? (
              <textarea
                value={content[key] ?? ""}
                onChange={(event) => updateContent(key, event.target.value)}
                rows={4}
                className="min-h-[120px] rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/40 focus:border-builder-accent focus:outline-none"
              />
            ) : (
              <input
                type={type ?? "text"}
                value={content[key] ?? ""}
                onChange={(event) => updateContent(key, event.target.value)}
                className="rounded-xl border border-slate-800/70 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-builder-accent focus:outline-none"
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
