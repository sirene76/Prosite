import { NextRequest, NextResponse } from "next/server";

import { recordAnalytics } from "@/lib/analyticsTracker";

function extractClientIp(req: NextRequest) {
  const header = req.headers.get("x-forwarded-for") || "";
  if (header) {
    const [first] = header.split(",");
    if (first) {
      return first.trim();
    }
  }

  return req.ip ?? "";
}

function getSiteIdFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "sites" || !segments[1]) {
    return null;
  }

  return segments[1];
}

function getSitePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "sites") {
    return "/";
  }

  const relevant = segments.slice(2);
  if (relevant.length === 0) {
    return "/";
  }

  return `/${relevant.join("/")}`;
}

export async function middleware(req: NextRequest) {
  if (req.method && req.method !== "GET") {
    return NextResponse.next();
  }

  const siteId = getSiteIdFromPath(req.nextUrl.pathname);
  if (!siteId) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.includes("/_next")) {
    return NextResponse.next();
  }

  const path = getSitePath(req.nextUrl.pathname);
  const referrer = req.headers.get("referer") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const ip = extractClientIp(req);

  try {
    await recordAnalytics(siteId, {
      path,
      referrer,
      userAgent,
      ip,
    });
  } catch (error) {
    console.warn("Traffic logging failed", error);
  }

  return NextResponse.next();
}
