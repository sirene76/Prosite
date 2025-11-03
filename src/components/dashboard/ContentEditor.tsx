"use client";

import { useState } from "react";

type ContentEditorProps = {
  website: {
    _id: string;
    values: Record<string, any>;
  };
};

export default function ContentEditor({ website }: ContentEditorProps) {
  const [values, setValues] = useState<Record<string, any>>(website.values || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/websites/${website._id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();

      if (data.success) {
        setSaved(true);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Website Title</label>
        <input
          type="text"
          value={values.websiteTitle || ""}
          onChange={(e) => handleChange("websiteTitle", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:ring-black sm:text-sm"
          placeholder="Your website title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Business Name</label>
        <input
          type="text"
          value={values.businessName || ""}
          onChange={(e) => handleChange("businessName", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:ring-black sm:text-sm"
          placeholder="Your business name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Logo URL</label>
        <input
          type="text"
          value={values.logoUrl || ""}
          onChange={(e) => handleChange("logoUrl", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:ring-black sm:text-sm"
          placeholder="/uploads/logo.png"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-3 inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 ${
          saving ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {saved && <p className="text-sm text-green-600 mt-2">Saved successfully!</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
