"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useBuilder } from "@/context/BuilderContext";
import { TemplateCard } from "./TemplateCard";
import { TemplateGalleryModal } from "@/components/ui/TemplateGalleryModal";

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type TemplateSelectionProps = {
  initialTemplateId?: string;
};

export function TemplateSelection({ initialTemplateId }: TemplateSelectionProps) {
  const { templates, selectedTemplate } = useBuilder();
  const router = useRouter();

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const galleryTemplates = useMemo(
    () =>
      templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        previewUrl: template.previewUrl,
        previewVideo: template.previewVideo,
      })),
    [templates]
  );

  const openGallery = (templateId: string) => {
    const index = galleryTemplates.findIndex((t) => t.id === templateId);
    if (index >= 0) {
      setGalleryIndex(index);
      setIsGalleryOpen(true);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/templates/${templateId}`);
  };

  const activeTemplateId = initialTemplateId ?? selectedTemplate?.id;

  const handlePreview = (templateId: string) => openGallery(templateId);

  const handleGalleryPrev = () => {
    if (!galleryTemplates.length) return;
    setGalleryIndex((current) => (current - 1 + galleryTemplates.length) % galleryTemplates.length);
  };

  const handleGalleryNext = () => {
    if (!galleryTemplates.length) return;
    setGalleryIndex((current) => (current + 1) % galleryTemplates.length);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Choose a starting point</h1>
        <p className="text-sm text-slate-400">
          Browse the available templates. You can preview each layout and switch templates anytime during the build.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isActive = template.id === activeTemplateId;

          return (
            <div
              key={template.id}
              className={classNames(
                "group flex flex-col overflow-hidden rounded-3xl border bg-gray-900/40 transition",
                isActive
                  ? "border-builder-accent/60 shadow-[0_16px_45px_-24px_rgba(14,165,233,0.6)]"
                  : "border-gray-800/80 hover:border-builder-accent/40"
              )}
            >
              <TemplateCard
                template={{
                  ...template,
                  preview: template.previewUrl,
                  video: template.previewVideo,
                }}
                className="rounded-none"
                onPreview={openGallery}
              />

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-100">{template.name}</h2>
                    {isActive ? (
                      <span className="rounded-full bg-builder-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-builder-accent">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-400">{template.description}</p>
                </div>

                <div className="mt-auto flex flex-wrap gap-3">
                  {/* ✅ This button now goes to overview page */}
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(template.id)}
                    className={classNames(
                      "flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "border-builder-accent bg-builder-accent text-slate-950 hover:brightness-110"
                        : "border-gray-800 bg-gray-950/70 text-slate-200 hover:border-builder-accent/60 hover:text-white"
                    )}
                  >
                    Use this template
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreview(template.id)}
                    className="rounded-full border border-gray-800/80 bg-gray-950/70 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-builder-accent/60 hover:text-white"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TemplateGalleryModal
        open={isGalleryOpen && Boolean(galleryTemplates.length)}
        index={galleryIndex}
        templates={galleryTemplates}
        onClose={() => setIsGalleryOpen(false)}
        onPrev={handleGalleryPrev}
        onNext={handleGalleryNext}
        onSelect={(templateId) => {
          handleSelectTemplate(templateId);
          setIsGalleryOpen(false);
        }}
      />
    </div>
  );
}
