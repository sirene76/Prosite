"use client";

import { useState } from "react";

interface PublishDraftButtonProps {
  templateId: string;
  version: string;
}

export function PublishDraftButton({ templateId, version }: PublishDraftButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setError(null);
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/versions/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to publish version");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish version");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPublishing}
        className="text-green-400 underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPublishing ? "Publishing…" : "Publish"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
