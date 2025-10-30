import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { triggerDeploy } from "@/lib/deployWorker";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }

    await connectDB();

    const website = await Website.findById(id);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };
    const sessionUserId = sessionWithId.userId;

    if (
      (website.user && website.user !== session.user.email) ||
      (website.userId && sessionUserId && String(website.userId) !== sessionUserId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = await triggerDeploy(id);

    await Website.findByIdAndUpdate(id, {
      $set: { "deployment.lastDeployedAt": new Date() },
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Failed to redeploy website", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
