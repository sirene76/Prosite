import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    await connectDB();

    const website = await Website.findById(params.id);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };
    if (website.userId && sessionWithId.userId && String(website.userId) !== sessionWithId.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (updates.theme && typeof updates.theme === "object") {
      website.theme = updates.theme;
    }
    if (updates.content && typeof updates.content === "object") {
      website.content = updates.content;
    }
    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      website.name = updates.name;
    }

    website.updatedAt = new Date();
    await website.save();

    return NextResponse.json(website);
  } catch (err) {
    console.error("Error updating website:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
