import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ✅ Force dynamic serving (Next.js 15 fix)
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
): Promise<NextResponse> {
  try {
    // Await params per Next.js 15 dynamic API
    const { path: segments = [] } = await params;

    if (!segments.length) {
      return new NextResponse("Missing path", { status: 400 });
    }

    // Build absolute path inside /public/templates
    const filePath = path.join(process.cwd(), "public", "templates", ...segments);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Detect MIME type for static assets
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === ".css"
        ? "text/css"
        : ext === ".js"
        ? "text/javascript"
        : ext === ".html"
        ? "text/html"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
        ? "image/png"
        : "application/octet-stream";

    // Serve file contents
    const data = fs.readFileSync(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: { "Content-Type": mime },
    });
  } catch (err) {
    console.error("❌ Failed to serve template asset:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
