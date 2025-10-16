import { Buffer } from "node:buffer";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export type UploadFileInput = {
  buffer: Buffer | ArrayBuffer | Uint8Array;
  fileName: string;
  contentType?: string;
};

export async function uploadFile({ buffer, fileName, contentType }: UploadFileInput) {
  const resolvedBuffer =
    buffer instanceof Buffer ? buffer : Buffer.from(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);

  const file = new File([resolvedBuffer], fileName, {
    type: contentType ?? "application/octet-stream",
  });

  const result = await utapi.uploadFiles([file]);
  const response = Array.isArray(result) ? result[0] : result;

  if (!response || response.error || !response.data?.ufsUrl) {
    const errorMessage = response?.error ?? "Upload failed";
    throw new Error(typeof errorMessage === "string" ? errorMessage : "Upload failed");
  }

  return response.data.ufsUrl;
}
