"use client";

import { useBuilder } from "@/context/BuilderContext";

type PageDefinition = {
  id: string;
  label: string;
  scrollAnchor?: string;
};

export function PageList({ pages }: { pages?: PageDefinition[] }) {
  const { previewFrame } = useBuilder();
  const resolvedPages = Array.isArray(pages) ? pages : [];

  const scrollToSection = (anchor?: string) => {
    const frameWindow = previewFrame?.contentWindow;
    if (!frameWindow) {
      return;
    }

    const selector = normaliseAnchor(anchor);
    const sectionId = normaliseSectionId(anchor);

    frameWindow.postMessage(
      {
        type: "scrollToSection",
        id: sectionId ?? undefined,
        selector: selector ?? undefined,
        anchor: selector ?? undefined,
      },
      "*"
    );
  };

  if (!resolvedPages.length) {
    return <p className="text-sm text-slate-400">No pages found in meta.json.</p>;
  }

  return (
    <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200/10">
      {resolvedPages.map((page) => (
        <button
          key={page.id}
          className="px-4 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 whitespace-nowrap text-sm text-slate-200 border border-gray-800/60"
          onClick={() => scrollToSection(page.scrollAnchor ?? page.id)}
          type="button"
        >
          {page.label}
        </button>
      ))}
    </div>
  );
}

function normaliseAnchor(anchor?: string) {
  if (!anchor) {
    return null;
  }
  const trimmed = anchor.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed === "#") {
    return "#";
  }
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function normaliseSectionId(anchor?: string) {
  const selector = normaliseAnchor(anchor);
  if (!selector || selector === "#") {
    return null;
  }
  return selector.replace(/^#/, "");
}

