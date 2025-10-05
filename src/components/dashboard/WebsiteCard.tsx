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
    <div className="p-4 border rounded-lg shadow-sm flex flex-col gap-2">
      <h3 className="font-semibold">{websiteName}</h3>
      <p className="text-sm text-gray-500">Status: {statusLabel}</p>

      <div className="flex gap-3 mt-2">
        <a
          href={`/builder/${website._id}`}
          className="text-blue-600 hover:underline"
        >
          Edit
        </a>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
