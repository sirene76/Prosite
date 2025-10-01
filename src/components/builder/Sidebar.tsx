"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useBuilder } from "@/context/BuilderContext";
import { PageList } from "./PageList";
import { ThemeSelector } from "./ThemeSelector";

type SidebarProps = {
  steps: { label: string; href: string }[];
  currentIndex: number;
};

const tabs = [
  { id: "pages", label: "Pages" },
  { id: "theme", label: "Theme" },
  { id: "content", label: "Content" }
] as const;

type TabId = (typeof tabs)[number]["id"];
type ContentFieldKey =
  | "name"
  | "tagline"
  | "about"
  | "portfolioHeading"
  | "contactEmail"
  | "resumeTitle"
  | "resumeSummary"
  | "testimonialQuote"
  | "testimonialAuthor"
  | "contactHeadline";

type ContentSection = {
  id: string;
  title: string;
  fields: {
    key: ContentFieldKey;
    label: string;
    type?: "textarea" | "email" | "text";
  }[];
};

const contentSections: ContentSection[] = [
  {
    id: "home",
    title: "Hero Section",
    fields: [
      { key: "name", label: "Hero headline" },
      { key: "tagline", label: "Hero tagline" },
    ],
  },
  {
    id: "about",
    title: "About Section",
    fields: [{ key: "about", label: "About section", type: "textarea" }],
  },
  {
    id: "services",
    title: "Experience Section",
    fields: [
      { key: "resumeTitle", label: "Resume section title" },
      { key: "resumeSummary", label: "Resume summary", type: "textarea" },
    ],
  },
  {
    id: "portfolio",
    title: "Portfolio Section",
    fields: [{ key: "portfolioHeading", label: "Portfolio heading" }],
  },
  {
    id: "testimonials",
    title: "Testimonials Section",
    fields: [
      { key: "testimonialQuote", label: "Testimonial quote", type: "textarea" },
      { key: "testimonialAuthor", label: "Testimonial author" },
    ],
  },
  {
    id: "contact",
    title: "Contact Section",
    fields: [
      { key: "contactHeadline", label: "Contact headline" },
      { key: "contactEmail", label: "Contact email", type: "email" },
    ],
  },
];

export function Sidebar({ steps, currentIndex }: SidebarProps) {
  const router = useRouter();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    selectedTemplate,
    content,
    updateContent,
    previewFrame,
  } = useBuilder();
  const [activeTab, setActiveTab] = useState<TabId>("pages");

  const currentStepLabel = useMemo(() => steps[currentIndex]?.label ?? "", [currentIndex, steps]);

  const handleNavigate = (direction: "prev" | "next") => {
    const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < steps.length) {
      router.push(steps[nextIndex].href);
    }
  };

  return (
    <aside
      className={clsx(
        "relative flex h-full flex-col border-l border-gray-900/70 bg-gray-900/80 text-slate-200 backdrop-blur transition-all duration-300",
        isSidebarCollapsed ? "w-14" : "w-[22rem]"
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute left-[-18px] top-6 flex h-9 w-9 items-center justify-center rounded-full border border-gray-900 bg-gray-950 text-slate-300 shadow-xl shadow-black/40 transition hover:text-white"
        aria-label={isSidebarCollapsed ? "Expand inspector" : "Collapse inspector"}
      >
        <span className="text-lg leading-none">{isSidebarCollapsed ? "›" : "‹"}</span>
      </button>

      {!isSidebarCollapsed ? (
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="border-b border-gray-900/60 px-4 pb-4 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Inspector</p>
            <p className="text-sm font-medium text-slate-200">{currentStepLabel || "Builder"}</p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="px-4 pt-4">
              <div className="grid grid-cols-3 gap-2 rounded-full bg-gray-800/60 p-1 text-xs font-medium text-slate-400">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "rounded-full px-3 py-1.5 transition",
                      activeTab === tab.id
                        ? "bg-gray-950 text-slate-100 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)]"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {activeTab === "pages" ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Structure</p>
                      <p className="text-sm font-semibold text-slate-100">{selectedTemplate.name}</p>
                    </div>
                    <PageList pages={selectedTemplate.pages} />
                  </div>
                ) : null}

                {activeTab === "theme" ? <ThemeSelector /> : null}

                {activeTab === "content" ? (
                  <ContentEditor
                    content={content}
                    updateContent={updateContent}
                    previewFrame={previewFrame}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-900/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate("prev")}
                disabled={currentIndex === 0}
                className="flex-1 rounded-full border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("next")}
                disabled={currentIndex === steps.length - 1}
                className="flex-1 rounded-full bg-builder-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

type ContentEditorProps = {
  content: Record<string, string>;
  updateContent: (changes: Record<string, string>) => void;
  previewFrame: HTMLIFrameElement | null;
};

function ContentEditor({ content, updateContent, previewFrame }: ContentEditorProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const currentSection = contentSections[currentSectionIndex];

  useEffect(() => {
    if (!previewFrame?.contentWindow || !currentSection) {
      return;
    }

    previewFrame.contentWindow.postMessage(
      {
        type: "scroll-to",
        id: currentSection.id,
      },
      "*"
    );
  }, [currentSection, previewFrame]);

  if (!currentSection) {
    return null;
  }

  const isFirst = currentSectionIndex === 0;
  const isLast = currentSectionIndex === contentSections.length - 1;

  const handleNavigate = (direction: "prev" | "next") => {
    setCurrentSectionIndex((prevIndex) => {
      if (direction === "prev") {
        return prevIndex > 0 ? prevIndex - 1 : prevIndex;
      }
      if (direction === "next") {
        return prevIndex < contentSections.length - 1 ? prevIndex + 1 : prevIndex;
      }
      return prevIndex;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-100">
          Editing: <span className="text-slate-300">{currentSection.title}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate("prev")}
            disabled={isFirst}
            className="rounded-full border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-builder-accent/60 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("next")}
            disabled={isLast}
            className="rounded-full border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-builder-accent/60 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      <form className="space-y-4 rounded-2xl border border-gray-800/60 bg-gray-950/50 p-4" onSubmit={(event) => event.preventDefault()}>
        {currentSection.fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={content[field.key] ?? ""}
                onChange={(event) => updateContent({ [field.key]: event.target.value })}
                rows={4}
                className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/40 transition focus:border-builder-accent focus:outline-none"
              />
            ) : (
              <input
                type={field.type ?? "text"}
                value={content[field.key] ?? ""}
                onChange={(event) => updateContent({ [field.key]: event.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-builder-accent focus:outline-none"
              />
            )}
          </label>
        ))}
      </form>
    </div>
  );
}
