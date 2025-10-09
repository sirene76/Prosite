"use client";

import { useTransition } from "react";

type TemplateAdminActionsProps = {
  id: string;
  published: boolean;
  featured: boolean;
};

export function TemplateAdminActions({ id, published, featured }: TemplateAdminActionsProps) {
  const [isPending, startTransition] = useTransition();

  async function toggle(field: "published" | "featured") {
    const nextValue = field === "published" ? !published : !featured;
    startTransition(async () => {
      await fetch(`/api/admin/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      location.reload();
    });
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => toggle("published")}
        disabled={isPending}
        className="rounded-md border border-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-70"
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        onClick={() => toggle("featured")}
        disabled={isPending}
        className="rounded-md border border-amber-500/50 px-3 py-1 font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-70"
      >
        {featured ? "Unfeature" : "Feature"}
      </button>
    </div>
  );
}
