import { UploadButton, UploadDropzone, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/route";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

// Re-export the UI components so all imports come from one place
export { UploadButton, UploadDropzone };
