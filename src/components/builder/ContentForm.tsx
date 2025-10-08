"use client";
/* eslint-disable @next/next/no-img-element */

import { Fragment } from "react";

import type { TemplateContentField, TemplateContentSection } from "@/context/BuilderContext";
import ImageDropInput from "@/components/ui/ImageDropInput";

const inputBaseClass =
  "w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-builder-accent focus:outline-none";

export type ContentFormProps = {
  section: TemplateContentSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export function ContentForm({ section, values, onChange }: ContentFormProps) {
  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      {section.fields.map((field) => (
        <Fragment key={field.key}>
          {renderField(field, values[field.key], onChange)}
        </Fragment>
      ))}
    </form>
  );
}

function renderField(
  field: TemplateContentField,
  value: unknown,
  onChange: (key: string, value: unknown) => void
) {
  const { key, label, type, placeholder, description } = field;

  if (type === "textarea") {
    const stringValue = toTextValue(value);
    return (
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <textarea
          value={stringValue}
          onChange={(event) => onChange(key, event.target.value)}
          placeholder={placeholder ?? field.defaultValue ?? ""}
          rows={5}
          className={`${inputBaseClass} min-h-[140px] resize-y`}
        />
        {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
      </label>
    );
  }

  if (type === "image") {
    const stringValue = toTextValue(value);
    return (
      <ImageDropInput
        label={label}
        value={stringValue}
        onChange={(url) => onChange(key, url)}
        onClear={() => onChange(key, "")}
        description={description}
      />
    );
  }

  if (type === "gallery") {
    const galleryItems = toGalleryItems(value);

    return (
      <div className="space-y-3">
        <ImageDropInput
          label={label}
          onChange={(url) => onChange(key, url)}
          description={description ?? "Drag and drop or click to add images."}
          mode="append"
        />

        {galleryItems.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {galleryItems.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-950/60"
              >
                <img
                  src={url}
                  alt={`${label ?? key} image ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      key,
                      galleryItems.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (type === "color") {
    const stringValue = toTextValue(value);
    return (
      <label className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
        <div
          className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
          style={{ backgroundColor: stringValue || "transparent" }}
        />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={ensureColorValue(stringValue)}
              onChange={(event) => onChange(key, event.target.value)}
              className="h-9 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
            />
            <input
              type="text"
              value={stringValue}
              placeholder={placeholder ?? "#000000"}
              onChange={(event) => onChange(key, event.target.value)}
              className={`${inputBaseClass} text-xs`}
            />
          </div>
          {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
        </div>
      </label>
    );
  }

  const inputType = type === "email" ? "email" : "text";
  const stringValue = toTextValue(value);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type={inputType}
        value={stringValue}
        placeholder={placeholder ?? field.defaultValue ?? ""}
        onChange={(event) => onChange(key, event.target.value)}
        className={inputBaseClass}
      />
      {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
    </label>
  );
}

function ensureColorValue(value: string | undefined) {
  if (!value) {
    return "#000000";
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

function toTextValue(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function toGalleryItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}
