"use client";
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";

import type { TemplateContentField, TemplateContentSection } from "@/context/BuilderContext";
import ImageDropInput from "@/components/ui/ImageDropInput";
import { UploadDropzone } from "@/utils/uploadthing";

const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|svg)$/i;

const inputBaseClass =
  "w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-builder-accent focus:outline-none";

export type ContentFormProps = {
  section: TemplateContentSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export function ContentForm({ section, values, onChange }: ContentFormProps) {
  const groups = useMemo(() => createFieldGroups(section.fields), [section.fields]);

  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {group.label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-600">
              {group.fields.length} fields
            </span>
          </div>
          <div className="space-y-4">
            {group.fields.map((field) => (
              <Fragment key={field.key}>
                {renderField(field, values[field.key], onChange)}
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </form>
  );
}

function renderField(
  field: TemplateContentField,
  value: unknown,
  onChange: (key: string, value: unknown) => void
) {
  const { key, label, placeholder, description } = field;
  const resolvedValue = value ?? field.defaultValue ?? "";
  const resolvedType = determineFieldType(field, resolvedValue);

  if (resolvedType === "textarea") {
    const stringValue = toTextValue(resolvedValue);
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

  if (resolvedType === "image") {
    const stringValue = toTextValue(resolvedValue);
    return (
      <ImageField
        label={label}
        description={description}
        value={stringValue}
        onUpload={(url) => onChange(key, url)}
        onClear={() => onChange(key, "")}
      />
    );
  }

  if (resolvedType === "gallery") {
    const galleryItems = toGalleryItems(resolvedValue);

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

  if (resolvedType === "color") {
    const stringValue = toTextValue(resolvedValue);
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

  const inputType = resolvedType === "email" ? "email" : "text";
  const stringValue = toTextValue(resolvedValue);

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

type FieldGroup = {
  id: string;
  label: string;
  fields: TemplateContentField[];
};

function createFieldGroups(fields: TemplateContentField[]): FieldGroup[] {
  const order: string[] = [];
  const map = new Map<string, TemplateContentField[]>();

  fields.forEach((field) => {
    const groupId = getFieldGroupId(field.key);
    if (!map.has(groupId)) {
      map.set(groupId, []);
      order.push(groupId);
    }
    map.get(groupId)?.push(field);
  });

  return order.map((groupId) => ({
    id: groupId,
    label: formatGroupLabel(groupId),
    fields: map.get(groupId) ?? [],
  }));
}

function getFieldGroupId(key: string) {
  if (!key.includes(".")) {
    return "general";
  }
  const [group] = key.split(".");
  return group?.trim() || "general";
}

function formatGroupLabel(groupId: string) {
  if (groupId === "general") {
    return "General";
  }
  return groupId
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}

function ensureColorValue(value: string | undefined) {
  if (!value) {
    return "#000000";
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

function determineFieldType(field: TemplateContentField, value: unknown): TemplateContentField["type"] {
  if (Array.isArray(value)) {
    return "gallery";
  }

  if (field.type === "gallery" || field.type === "image" || field.type === "color") {
    return field.type;
  }

  if (typeof value === "string" && isLikelyImageUrl(value)) {
    return "image";
  }

  if (field.type === "textarea" || field.type === "email") {
    return field.type;
  }

  return field.type ?? "text";
}

function isLikelyImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^data:image\//i.test(trimmed)) {
    return true;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return true;
  }

  return IMAGE_URL_PATTERN.test(trimmed);
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

type ImageFieldProps = {
  label?: string;
  description?: string;
  value: string;
  onUpload: (url: string) => void;
  onClear: () => void;
};

function ImageField({ label, description, value, onUpload, onClear }: ImageFieldProps) {
  const trimmedValue = value.trim();
  const hasImage = trimmedValue.length > 0;
  const [isReplacing, setIsReplacing] = useState(!hasImage);

  useEffect(() => {
    if (!hasImage) {
      setIsReplacing(true);
    }
  }, [hasImage]);

  const handleUploadComplete = (uploads?: Array<{ url?: string | null }>) => {
    const [firstUpload] = uploads ?? [];
    const uploadedUrl = firstUpload?.url?.trim();
    if (uploadedUrl) {
      onUpload(uploadedUrl);
      setIsReplacing(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      ) : null}

      {hasImage && !isReplacing ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950/60">
            <div className="relative h-48 w-full">
              <Image
                src={trimmedValue}
                alt={label ?? "Uploaded image"}
                fill
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsReplacing(true)}
              className="rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-builder-accent/50 hover:text-slate-100"
            >
              Replace image
            </button>
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsReplacing(true);
              }}
              className="rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-rose-500/40 hover:text-rose-200"
            >
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <UploadDropzone
            endpoint="templateImage"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              console.error("Image upload failed", error);
            }}
            className="ut-upload-area flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-6 text-center text-sm text-slate-300 transition hover:border-builder-accent/60 hover:text-slate-100"
            appearance={{
              uploadIcon: "h-10 w-10 text-slate-500",
              label: "text-sm font-medium text-slate-200",
              allowedContent: "text-xs text-slate-500",
            }}
          />
          <p className="text-xs text-slate-500">Drag and drop an image or click to choose one.</p>
          {hasImage ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsReplacing(false)}
                className="rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-builder-accent/50 hover:text-slate-100"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      )}

      {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
    </div>
  );
}
