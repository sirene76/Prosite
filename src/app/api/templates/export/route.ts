import path from "path";

import { NextResponse } from "next/server";

import { renderTemplate } from "@/lib/renderTemplate";
import {
  getTemplateAssetFiles,
  getTemplateAssets,
  getTemplateById,
  type TemplateColorDefinition,
  type TemplateRegistryEntry,
} from "@/lib/templates";

type ThemePayload = {
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
};

type ExportRequest = {
  templateId?: string;
  content?: Record<string, string>;
  theme?: ThemePayload;
  themeDefaults?: ThemePayload;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportRequest;
    const templateId = body.templateId?.trim();

    if (!templateId) {
      return NextResponse.json({ error: "Missing template identifier" }, { status: 400 });
    }

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const [{ html, css }, assetFiles] = await Promise.all([
      getTemplateAssets(template.id),
      getTemplateAssetFiles(template.id),
    ]);

    const rendered = renderTemplate({
      html,
      values: body.content ?? {},
      modules: template.modules,
    });

    const finalHtml = wrapWithDocument(rendered);
    const themedCss = applyTheme(css, template, body.theme ?? {}, body.themeDefaults ?? {});

    const files = [
      { name: "index.html", content: Buffer.from(finalHtml, "utf-8") },
      { name: "style.css", content: Buffer.from(themedCss, "utf-8") },
      ...assetFiles.map((file) => ({
        name: path.posix.join("assets", file.relativePath),
        content: file.content,
      })),
    ];

    const archive = createZipArchive(files);

    return new NextResponse(archive, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${template.id}.zip\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export template", error);
    return NextResponse.json({ error: "Unable to generate export" }, { status: 500 });
  }
}

function applyTheme(
  css: string,
  template: TemplateRegistryEntry,
  theme: ThemePayload,
  themeDefaults: ThemePayload
) {
  const tokens: string[] = [];

  template.colors.forEach((color: TemplateColorDefinition) => {
    const key = color.id;
    const value =
      theme.colors?.[key] ??
      themeDefaults.colors?.[key] ??
      color.default ??
      "";

    if (value) {
      tokens.push(`--color-${key}: ${value}; --${key}-color: ${value};`);
    }
  });

  template.fonts.forEach((font) => {
    const value = theme.fonts?.[font] ?? themeDefaults.fonts?.[font] ?? "";
    if (value) {
      tokens.push(`--font-${font}: ${value};`);
    }
  });

  if (!tokens.length) {
    return css;
  }

  return `:root { ${tokens.join(" ")} }\n${css}`;
}

function wrapWithDocument(html: string) {
  const trimmed = html.trim();
  if (/^<!DOCTYPE/i.test(trimmed) || /^<html/i.test(trimmed)) {
    return trimmed;
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><link rel="stylesheet" href="./style.css" /></head><body>${trimmed}</body></html>`;
}

function createZipArchive(files: Array<{ name: string; content: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  files.forEach((file) => {
    const fileName = file.name.replace(/\\/g, "/");
    const nameBuffer = Buffer.from(fileName, "utf-8");
    const data = file.content;
    const crc = crc32(data);
    const dosTime = getDosTime();
    const dosDate = getDosDate();

    const localHeader = Buffer.alloc(30);
    let pointer = 0;
    localHeader.writeUInt32LE(0x04034b50, pointer);
    pointer += 4;
    localHeader.writeUInt16LE(20, pointer);
    pointer += 2;
    localHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    localHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    localHeader.writeUInt16LE(dosTime, pointer);
    pointer += 2;
    localHeader.writeUInt16LE(dosDate, pointer);
    pointer += 2;
    localHeader.writeUInt32LE(crc >>> 0, pointer);
    pointer += 4;
    localHeader.writeUInt32LE(data.length, pointer);
    pointer += 4;
    localHeader.writeUInt32LE(data.length, pointer);
    pointer += 4;
    localHeader.writeUInt16LE(nameBuffer.length, pointer);
    pointer += 2;
    localHeader.writeUInt16LE(0, pointer);
    pointer += 2;

    const localRecord = Buffer.concat([localHeader, nameBuffer, data]);
    localParts.push(localRecord);

    const centralHeader = Buffer.alloc(46);
    pointer = 0;
    centralHeader.writeUInt32LE(0x02014b50, pointer);
    pointer += 4;
    centralHeader.writeUInt16LE(20, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(20, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(dosTime, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(dosDate, pointer);
    pointer += 2;
    centralHeader.writeUInt32LE(crc >>> 0, pointer);
    pointer += 4;
    centralHeader.writeUInt32LE(data.length, pointer);
    pointer += 4;
    centralHeader.writeUInt32LE(data.length, pointer);
    pointer += 4;
    centralHeader.writeUInt16LE(nameBuffer.length, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    centralHeader.writeUInt16LE(0, pointer);
    pointer += 2;
    centralHeader.writeUInt32LE(0, pointer);
    pointer += 4;
    centralHeader.writeUInt32LE(offset, pointer);
    pointer += 4;

    const centralRecord = Buffer.concat([centralHeader, nameBuffer]);
    centralParts.push(centralRecord);

    offset += localRecord.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const localLength = localParts.reduce((sum, part) => sum + part.length, 0);

  const endRecord = Buffer.alloc(22);
  let pointer = 0;
  endRecord.writeUInt32LE(0x06054b50, pointer);
  pointer += 4;
  endRecord.writeUInt16LE(0, pointer);
  pointer += 2;
  endRecord.writeUInt16LE(0, pointer);
  pointer += 2;
  endRecord.writeUInt16LE(centralParts.length, pointer);
  pointer += 2;
  endRecord.writeUInt16LE(centralParts.length, pointer);
  pointer += 2;
  endRecord.writeUInt32LE(centralDirectory.length, pointer);
  pointer += 4;
  endRecord.writeUInt32LE(localLength, pointer);
  pointer += 4;
  endRecord.writeUInt16LE(0, pointer);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i];
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDate(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return ((year - 1980) << 9) | (month << 5) | day;
}

function getDosTime(date = new Date()) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  return (hours << 11) | (minutes << 5) | seconds;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      if ((value & 1) === 1) {
        value = 0xedb88320 ^ (value >>> 1);
      } else {
        value >>>= 1;
      }
    }
    table[index] = value >>> 0;
  }
  return table;
})();
