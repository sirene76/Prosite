import { randomBytes } from "crypto";

export function generatePreviewToken() {
  return randomBytes(16).toString("hex");
}
