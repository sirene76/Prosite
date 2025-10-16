import { Buffer } from "node:buffer";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export type UploadFileInput = {
  buffer: BlobPart | ArrayBuffer | Uint8Array;
  fileName: string;
  contentType?: string;
};

export async function uploadFile({ buffer, fileName, contentType }: UploadFileInput) {
  const source: BlobPart =
    buffer instanceof ArrayBuffer || buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer;

  const file = new File([source], fileName, { type: contentType ?? "application/octet-stream" });
  const response = await utapi.uploadFiles(file);

  if (!response || response.error || !response.data?.ufsUrl) {
    throw new Error(response?.error ?? "Upload failed");
  }

  return response.data.ufsUrl;
}
