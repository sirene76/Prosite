"use client";

import { ChangeEvent } from "react";

import { useUploadThing } from "@/lib/uploadthing";

type TemplateImageUploaderProps = {
  label: string;
  onUploadComplete: (urls: string[]) => void;
};

export function TemplateImageUploader({
  label,
  onUploadComplete,
}: TemplateImageUploaderProps) {
  const { startUpload, isUploading } = useUploadThing("templateAssets");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) {
      return;
    }

    const result = await startUpload(files);
    const urls =
      result?.map((r) => r.url ?? "").filter((url): url is string => url.length > 0) ?? [];
    if (!urls.length) {
      return;
    }

    onUploadComplete(urls);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFiles}
        className="w-full text-sm text-slate-400"
      />
      {isUploading ? (
        <p className="mt-1 text-xs text-blue-400">Uploading...</p>
      ) : null}
    </div>
  );
}
