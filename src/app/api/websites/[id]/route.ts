import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { isValidObjectId } from "mongoose";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }

    await connectDB();
    const website = await Website.findById(id).lean();
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const payload = { ...website, _id: website._id?.toString() };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }

    const body = await req.json();

    await connectDB();

    const updated = await Website.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const website = await Website.findById(id);
  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  if (website.user !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Website.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
