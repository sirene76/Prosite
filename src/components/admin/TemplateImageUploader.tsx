"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type TemplateImageUploaderProps = {
  label?: string;
  endpoint?: keyof OurFileRouter;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
};

export function TemplateImageUploader({
  label = "Upload Template Image or Video",
  endpoint = "templateAssets",
  onUploadComplete,
  onUploadError,
  className = "",
}: TemplateImageUploaderProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {label ? <p className="text-white">{label}</p> : null}
      <UploadButton<OurFileRouter>
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          const urls = (res ?? [])
            .map((file) => file.url ?? "")
            .filter((url): url is string => Boolean(url));
          if (urls.length > 0) {
            alert(`File uploaded! URL: ${urls[0]}`);
          }
          console.log("Upload result:", res);
          onUploadComplete?.(urls);
        }}
        onUploadError={(error) => {
          alert(`Upload failed: ${error.message}`);
          onUploadError?.(error);
        }}
      />
    </div>
  );
}
