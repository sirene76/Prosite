"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

import { useBuilder } from "@/context/BuilderContext";

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type TemplateSelectionProps = {
  initialTemplateId?: string;
};

type CreateWebsiteResponse = {
  _id: string;
  templateId: string;
  status: "draft" | "active" | "published";
};

export function TemplateSelection({ initialTemplateId }: TemplateSelectionProps) {
  const { templates, selectedTemplate, selectTemplate, websiteId, setWebsiteId } = useBuilder();
  const router = useRouter();
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [isCreatingWebsite, setIsCreatingWebsite] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!initialTemplateId) {
      return;
    }

    const hasTemplate = templates.some((template) => template.id === initialTemplateId);

    if (hasTemplate) {
      selectTemplate(initialTemplateId);
    }
  }, [initialTemplateId, selectTemplate, templates]);

  if (!templates.length) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-800/60 bg-gray-950/50 p-6 text-center text-sm text-slate-400">
        <p>No templates found. Add a folder under <code className="rounded bg-gray-900/80 px-1 py-0.5">/templates</code> to get started.</p>
      </div>
    );
  }

  const handlePreview = (templateId: string) => {
    const previewUrl = `/templates/${encodeURIComponent(templateId)}`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleSelectTemplate = async (templateId: string) => {
    if (isCreatingWebsite) {
      return;
    }

    if (!session) {
      await signIn(undefined, {
        callbackUrl: `/builder/templates?selected=${encodeURIComponent(templateId)}`,
      });
      return;
    }

    selectTemplate(templateId);
    setPendingTemplateId(templateId);
    setIsCreatingWebsite(true);

    try {
      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create website (status ${response.status})`);
      }

      const website: CreateWebsiteResponse = await response.json();

      if (!website?._id) {
        throw new Error("Website response did not include an _id");
      }

      setWebsiteId(website._id);
      router.replace(`/builder/${website._id}/theme`);
    } catch (error) {
      console.error("Failed to create website from template", error);
    } finally {
      setPendingTemplateId(null);
      setIsCreatingWebsite(false);
    }
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
        {templates.map((template, index) => {
          const isActive = template.id === selectedTemplate.id;
          const isPending = pendingTemplateId === template.id;

          return (
            <div
              key={template.id}
              className={classNames(
                "group flex flex-col overflow-hidden rounded-3xl border bg-gray-900/40 transition",
                isActive ? "border-builder-accent/60 shadow-[0_16px_45px_-24px_rgba(14,165,233,0.6)]" : "border-gray-800/80 hover:border-builder-accent/40"
              )}
            >
              <div className="relative h-64 w-full bg-gray-900">
                {template.previewImage ? (
                  <Image
                    src={template.previewImage}
                    alt={template.name}
                    fill
                    priority={index < 3}
                    className="object-cover"
                    sizes="(min-width: 1280px) 320px, (min-width: 768px) 260px, 100vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-xs uppercase tracking-[0.3em] text-slate-500">
                    No Preview
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>

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
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(template.id)}
                    className={classNames(
                      "flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "border-builder-accent bg-builder-accent text-slate-950 hover:brightness-110"
                        : "border-gray-800 bg-gray-950/70 text-slate-200 hover:border-builder-accent/60 hover:text-white"
                    )}
                    disabled={isCreatingWebsite}
                    aria-busy={isPending}
                  >
                    {isPending ? "Creating website..." : isActive ? "Using template" : "Select template"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreview(template.id)}
                    className="rounded-full border border-gray-800/80 bg-gray-950/70 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-builder-accent/60 hover:text-white"
                  >
                    Preview
                  </button>
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (websiteId) {
                          router.replace(`/builder/${websiteId}/theme`);
                          return;
                        }

                        void handleSelectTemplate(template.id);
                      }}
                      className="flex-1 rounded-full border border-builder-accent/70 bg-builder-accent/10 px-4 py-2 text-sm font-semibold text-builder-accent transition hover:bg-builder-accent/20"
                      disabled={isCreatingWebsite}
                    >
                      Continue to theme
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
