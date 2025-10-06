"use client";

import { useState } from "react";

import type { DashboardWebsite } from "@/types/website";

type WebsiteCardProps = {
  website: DashboardWebsite;
  onDeleted: (id: string) => void;
};

export function WebsiteCard({ website, onDeleted }: WebsiteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const websiteName = typeof website.name === "string" ? website.name : "Untitled";
  const statusLabel = typeof website.status === "string" ? website.status : "unknown";
  const templateLabel = typeof website.templateId === "string" ? website.templateId : "custom";

  async function handleDelete() {
    if (!confirm(`Delete "${websiteName}"? This cannot be undone.`)) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/websites/${website._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete website");
      onDeleted(website._id);
    } catch (err) {
      console.error(err);
      alert("Could not delete website");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
      <div>
        <h3 className="font-semibold text-white">{websiteName}</h3>
        <p className="text-sm text-slate-400">Status: {statusLabel}</p>
      </div>
      <p className="text-sm text-slate-400">Template: {templateLabel}</p>
      <p className="text-xs text-slate-500">ID: {website._id}</p>

      <div className="mt-2 flex gap-3">
        <a
          href={`/builder/${website._id}/theme`}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          Edit in Builder
        </a>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
