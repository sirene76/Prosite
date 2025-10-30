"use client";

import { useState } from "react";

type ContentEditorProps = {
  website: {
    _id: string;
    values?: Record<string, unknown> | null;
  };
};

type EditorValues = Record<string, string>;

function normalizeValues(values?: Record<string, unknown> | null): EditorValues {
  if (!values || typeof values !== "object") {
    return {};
  }

  return Object.entries(values).reduce<EditorValues>((acc, [key, value]) => {
    if (typeof value === "string") {
      acc[key] = value;
      return acc;
    }

    if (value == null) {
      acc[key] = "";
      return acc;
    }

    if (typeof value === "object") {
      acc[key] = JSON.stringify(value);
      return acc;
    }

    acc[key] = String(value);
    return acc;
  }, {});
}

export default function ContentEditor({ website }: ContentEditorProps) {
  const [values, setValues] = useState<EditorValues>(() => normalizeValues(website.values));
  const [saving, setSaving] = useState(false);

  async function saveChanges() {
    try {
      setSaving(true);
      const response = await fetch(`/api/websites/${website._id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      alert("✅ Content saved!");
    } catch (error) {
      console.error(error);
      alert("❌ Unable to save content. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  const keys = Object.keys(values);

  return (
    <div className="space-y-4">
      {keys.length === 0 && (
        <p className="text-sm text-gray-500">No editable content fields available yet.</p>
      )}

      {keys.map((key) => (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">{key}</label>
          <input
            value={values[key] ?? ""}
            onChange={(event) => handleChange(key, event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      ))}

      <button
        onClick={saveChanges}
        disabled={saving || keys.length === 0}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? "Saving..." : "💾 Save Changes"}
      </button>
    </div>
  );
}
