"use client";

type PageDefinition = {
  id: string;
  label: string;
  scrollAnchor?: string;
};

export function PageList({ pages }: { pages?: PageDefinition[] }) {
  const resolvedPages = Array.isArray(pages) ? pages : [];
  const scrollToSection = (anchor?: string) => {
    const resolvedAnchor = normaliseAnchor(anchor);
    const iframe = document.querySelector<HTMLIFrameElement>("#livePreview");
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: "scrollTo", anchor: resolvedAnchor }, "*");
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

const PLAIN_ANCHOR_PATTERN = /^[A-Za-z0-9_-]+$/;

function normaliseAnchor(anchor?: string) {
  if (!anchor) return "#";
  const trimmed = anchor.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("#")) {
    return trimmed;
  }
  return PLAIN_ANCHOR_PATTERN.test(trimmed) ? `#${trimmed}` : trimmed;
}

