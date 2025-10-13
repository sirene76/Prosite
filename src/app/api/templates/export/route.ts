import { NextResponse } from "next/server";

import { ensureImageReferrerPolicy } from "@/lib/ensureImageReferrerPolicy";
import { renderTemplate } from "@/lib/renderTemplate";
import {
  getTemplateAssets,
  type TemplateColorDefinition,
  type TemplateDefinition,
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

    const assets = await getTemplateAssets(templateId);
    if (!assets) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const { template, html, css } = assets;

    const rendered = renderTemplate({
      html,
      values: body.content ?? {},
      modules: template.modules,
    });

    const htmlWithReferrerPolicy = ensureImageReferrerPolicy(rendered);

    const finalHtml = wrapWithDocument(htmlWithReferrerPolicy);
    const themedCss = applyTheme(css, template, body.theme ?? {}, body.themeDefaults ?? {});

    const files = [
      { name: "index.html", content: Buffer.from(finalHtml, "utf-8") },
      { name: "style.css", content: Buffer.from(themedCss, "utf-8") },
    ];

    const archive = createZipArchive(files);

    return new NextResponse(archive, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${template.slug ?? template.id}.zip\"`,
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
  template: TemplateDefinition,
  theme: ThemePayload,
  themeDefaults: ThemePayload
) {
  const colorTokens = buildThemeColorTokens(template, theme, themeDefaults);
  const fontTokens = buildThemeFontTokens(template, theme, themeDefaults);

  const tokens = [
    ...Object.entries(colorTokens).map(
      ([key, value]) => `--color-${key}: ${value}; --${key}-color: ${value};`
    ),
    ...Object.entries(fontTokens).map(([key, value]) => `--font-${key}: ${value};`),
  ];

  if (!tokens.length) {
    return css;
  }

  return `:root { ${tokens.join(" ")} }\n${css}`;
}

function buildThemeColorTokens(
  template: TemplateDefinition,
  theme?: ThemePayload,
  themeDefaults?: ThemePayload
) {
  const tokens: Record<string, string> = {};
  template.colors.forEach((color: TemplateColorDefinition) => {
    const key = color.id;
    const value =
      theme?.colors?.[key] ??
      themeDefaults?.colors?.[key] ??
      color.default ??
      "";

    if (value) {
      tokens[key] = value;
    }
  });
  return tokens;
}

function buildThemeFontTokens(
  template: TemplateDefinition,
  theme?: ThemePayload,
  themeDefaults?: ThemePayload
) {
  const tokens: Record<string, string> = {};
  template.fonts.forEach((font) => {
    const value = theme?.fonts?.[font] ?? themeDefaults?.fonts?.[font] ?? "";
    if (value) {
      tokens[font] = value;
    }
  });
  return tokens;
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
  const localDirectory = Buffer.concat(localParts);

  const endRecord = Buffer.alloc(22);
  let pointer = 0;
  endRecord.writeUInt32LE(0x06054b50, pointer);
  pointer += 4;
  endRecord.writeUInt16LE(0, pointer);
  pointer += 2;
  endRecord.writeUInt16LE(0, pointer);
  pointer += 2;
  endRecord.writeUInt16LE(files.length, pointer);
  pointer += 2;
  endRecord.writeUInt16LE(files.length, pointer);
  pointer += 2;
  endRecord.writeUInt32LE(centralDirectory.length, pointer);
  pointer += 4;
  endRecord.writeUInt32LE(localDirectory.length, pointer);
  pointer += 4;
  endRecord.writeUInt16LE(0, pointer);

  return Buffer.concat([localDirectory, centralDirectory, endRecord]);
}

function crc32(buffer: Buffer) {
  let crc = ~0;
  for (let offset = 0; offset < buffer.length; offset += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[offset]) & 0xff];
  }
  return ~crc;
}

const table = (() => {
  const result = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    result[i] = c >>> 0;
  }
  return result;
})();

function getDosTime(date = new Date()) {
  return (
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  );
}

function getDosDate(date = new Date()) {
  return (
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate()
  );
}
