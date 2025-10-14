import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const TEMPLATE_ROOT = path.join(process.cwd(), "public", "templates");

type RouteParams = { path?: string[] };

type RouteContext = {
  params?: RouteParams | Promise<RouteParams>;
};

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
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function resolveParams(context: RouteContext): Promise<RouteParams> {
  const { params } = context;

  if (params && typeof (params as Promise<RouteParams>).then === "function") {
    return await (params as Promise<RouteParams>);
  }

  return (params as RouteParams) ?? {};
}

async function handleRequest(_req: NextRequest, params: RouteParams) {
  const segments = (params.path ?? []).map((segment) => decodeURIComponent(segment));

  if (segments.length === 0) {
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

  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": getContentType(normalizedPath),
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await resolveParams(context);
  return handleRequest(req, params);
}

export async function HEAD(req: NextRequest, context: RouteContext) {
  const params = await resolveParams(context);
  const response = await handleRequest(req, params);

  if (!response.ok) {
    return response;
  }

  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
