import { generateReactHelpers } from "@uploadthing/react/hooks";
import type { OurFileRouter } from "@/app/api/uploadthing/route";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

export { UploadButton, UploadDropzone } from "@uploadthing/react";
