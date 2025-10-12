import { generateReactHelpers } from "@uploadthing/react/hooks";
import type { OurFileRouter } from "@/app/api/uploadthing/route";

export const { UploadButton, UploadDropzone, useUploadThing } =
  generateReactHelpers<OurFileRouter>();
