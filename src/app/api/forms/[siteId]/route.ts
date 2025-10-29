import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import Message from "@/models/Message";

function serializeMessage(message: Record<string, unknown>) {
  const createdAtValue = message.createdAt;
  const createdAt =
    createdAtValue instanceof Date
      ? createdAtValue
      : createdAtValue
      ? new Date(String(createdAtValue))
      : undefined;

  return {
    _id: message._id ? String(message._id) : undefined,
    siteId: typeof message.siteId === "string" ? message.siteId : undefined,
    name: typeof message.name === "string" ? message.name : undefined,
    email: typeof message.email === "string" ? message.email : undefined,
    message: typeof message.message === "string" ? message.message : undefined,
    createdAt: createdAt ? createdAt.toISOString() : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    if (!siteId || !isValidObjectId(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 });
    }

    await connectDB();
    const website = await Website.findById(siteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };
    if (
      (website.user && website.user !== session.user.email) ||
      (website.userId && sessionWithId.userId && String(website.userId) !== sessionWithId.userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await Message.find({ siteId }).sort({ createdAt: -1 }).lean();
    const payload = messages.map((message) => serializeMessage(message as Record<string, unknown>));

    return NextResponse.json({ messages: payload });
  } catch (error) {
    console.error("Failed to load messages", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    if (!siteId || !isValidObjectId(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };

    const { name = "", email = "", message } = body;
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectDB();
    const websiteExists = await Website.exists({ _id: siteId });
    if (!websiteExists) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const savedMessage = await Message.create({
      siteId,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    return NextResponse.json(
      {
        message: serializeMessage(savedMessage.toObject()),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit message", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
