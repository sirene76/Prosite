import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { middleware as trafficLogger } from "@/middleware/TrafficLogger";

const protectedRoutes = withAuth(
  async function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const token = await getToken({ req });
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/sites")) {
    return trafficLogger(req);
  }

  return protectedRoutes(req);
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/admin/:path*", "/sites/:path*"],
};

export default middleware;
