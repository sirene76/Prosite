/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type TemplateGridTemplate = {
  _id: string;
  name?: string;
  category?: string;
  description?: string;
  image?: string;
  published?: boolean;
};

type PendingAction = {
  id: string;
  type: "delete" | "unpublish";
};

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) {
      return data.error;
    }
  } catch (error) {
    console.warn("Failed to parse error response", error);
  }
  return fallback;
}

export function TemplateGrid({ templates }: { templates: TemplateGridTemplate[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handleDelete = async (id: string) => {
    setError(null);
    setPendingAction({ id, type: "delete" });
    try {
      const response = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to delete template"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setPendingAction(null);
    }
  };

  const handleUnpublish = async (id: string) => {
    setError(null);
    setPendingAction({ id, type: "unpublish" });
    try {
      const response = await fetch(`/api/admin/templates/${id}/unpublish`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Failed to unpublish template"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish template");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {templates.map((tpl) => {
          const isPending = pendingAction?.id === tpl._id;

          return (
            <div
              key={tpl._id}
              className="flex flex-col overflow-hidden rounded-lg border shadow transition hover:shadow-md"
            >
              {tpl.image ? (
                <img
                  src={tpl.image}
                  alt={tpl.name || "Template preview"}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                  No preview
                </div>
              )}
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{tpl.name}</h2>
                  <p className="text-sm text-gray-500">{tpl.category}</p>
                  <p className="line-clamp-2 text-sm text-gray-600">{tpl.description}</p>
                </div>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    tpl.published === false
                      ? "bg-gray-200 text-gray-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {tpl.published === false ? "Unpublished" : "Published"}
                </span>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link
                    href={`/admin/templates/${tpl._id}/edit`}
                    className="rounded-md border border-pink-200 px-3 py-1.5 text-sm font-medium text-pink-700 transition hover:bg-pink-50"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleUnpublish(tpl._id)}
                    className="rounded-md border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                    disabled={isPending || tpl.published === false}
                  >
                    Unpublish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tpl._id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    disabled={isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
