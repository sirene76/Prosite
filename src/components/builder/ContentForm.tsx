"use client";

import { Fragment } from "react";

import type { TemplateContentField, TemplateContentSection } from "@/context/BuilderContext";
import ImageDropInput from "@/components/ui/ImageDropInput";

const inputBaseClass =
  "w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-builder-accent focus:outline-none";

export type ContentFormProps = {
  section: TemplateContentSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
};

export function ContentForm({ section, values, onChange }: ContentFormProps) {
  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      {section.fields.map((field) => (
        <Fragment key={field.key}>
          {renderField(field, toInputValue(values[field.key]), onChange)}
        </Fragment>
      ))}
    </form>
  );
}

function toInputValue(value: unknown): string {
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

function renderField(
  field: TemplateContentField,
  value: string,
  onChange: (key: string, value: string) => void
) {
  const { key, label, type, placeholder, description } = field;

  if (type === "textarea") {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <textarea
          value={value}
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
    return (
      <ImageDropInput
        label={label}
        value={value}
        onChange={(url) => onChange(key, url)}
        onClear={() => onChange(key, "")}
        description={description}
      />
    );
  }

  if (type === "color") {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
        <div
          className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
          style={{ backgroundColor: value || "transparent" }}
        />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={ensureColorValue(value)}
              onChange={(event) => onChange(key, event.target.value)}
              className="h-9 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
            />
            <input
              type="text"
              value={value}
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

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type={inputType}
        value={value}
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
