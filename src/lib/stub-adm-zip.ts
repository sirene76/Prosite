import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

class ZipEntry {
  constructor(private zipPath: string, public entryName: string) {}

  get isDirectory() {
    return this.entryName.endsWith("/");
  }

  getData() {
    if (this.isDirectory) {
      return Buffer.alloc(0);
    }

    return execFileSync("unzip", ["-p", this.zipPath, this.entryName]);
  }
}

export default class AdmZip {
  private zipPath: string;
  private cleanupDir: string | null = null;

  constructor(source: Buffer | Uint8Array | string) {
    if (typeof source === "string") {
      this.zipPath = source;
      return;
    }

    const dir = mkdtempSync(path.join(tmpdir(), "adm-zip-"));
    this.cleanupDir = dir;
    this.zipPath = path.join(dir, "archive.zip");
    writeFileSync(this.zipPath, Buffer.from(source));
  }

  getEntries() {
    const output = execFileSync("unzip", ["-Z1", this.zipPath], { encoding: "utf8" });
    const entries = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return entries.map((entryName) => new ZipEntry(this.zipPath, entryName));
  }

  dispose() {
    if (this.cleanupDir) {
      rmSync(this.cleanupDir, { recursive: true, force: true });
      this.cleanupDir = null;
    }
  }
}

export type { ZipEntry };
