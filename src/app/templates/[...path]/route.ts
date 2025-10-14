import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const TEMPLATE_ROOT = path.join(process.cwd(), "public", "templates");

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

async function readStaticFile(filePath: string) {
  try {
    const file = await fs.readFile(filePath);
    return file;
  } catch (_error: unknown) {
    return null;
  }
}

async function handleRequest(
  _req: NextRequest,
  params: { path?: string[] }
): Promise<NextResponse> {
  const segments = params.path ?? [];

  if (!segments.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const requestedPath = path.join(TEMPLATE_ROOT, ...segments);
  const normalizedPath = path.normalize(requestedPath);

  if (!normalizedPath.startsWith(TEMPLATE_ROOT)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = await readStaticFile(normalizedPath);

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": getContentType(normalizedPath),
    "Cache-Control": "public, max-age=0, must-revalidate",
  });

  return new NextResponse(file, {
    status: 200,
    headers,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  return handleRequest(req, params);
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const response = await handleRequest(req, params);
  if (!response.ok) {
    return response;
  }

  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
