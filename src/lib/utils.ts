import { randomBytes } from "crypto";
import clsx, { type ClassValue } from "clsx";

export function generatePreviewToken() {
  return randomBytes(16).toString("hex");
}

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}
