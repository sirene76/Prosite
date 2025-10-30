import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

export async function PATCH(
  req: Request,
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

    const payload = (await req.json()) as {
      values?: Record<string, unknown> | Map<string, unknown> | unknown;
    };

    const rawValues = payload?.values;
    let values: Record<string, unknown> = {};

    if (rawValues instanceof Map) {
      values = Object.fromEntries(rawValues.entries());
    } else if (rawValues && typeof rawValues === "object" && !Array.isArray(rawValues)) {
      values = { ...rawValues } as Record<string, unknown>;
    }

    await connectDB();

    const sessionWithId = session as typeof session & { userId?: string };
    const ownershipFilters: Record<string, unknown>[] = [];

    if (session.user.email) {
      ownershipFilters.push({ user: session.user.email });
    }
    if (sessionWithId.userId) {
      ownershipFilters.push({ userId: sessionWithId.userId });
    }

    const filter =
      ownershipFilters.length > 0
        ? { _id: id, $or: ownershipFilters }
        : { _id: id };

    const site = await Website.findOneAndUpdate(
      filter,
      { $set: { values } },
      { new: true }
    );

    if (!site) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Failed to update website content", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
