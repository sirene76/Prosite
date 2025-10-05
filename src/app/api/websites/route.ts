import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";
import { getTemplateAssets, getTemplateById } from "@/lib/templates";
import type { WebsiteModel } from "@/models/website";
import type { DashboardWebsite } from "@/types/website";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("templateId");

  if (templateId) {
    try {
      const assets = await getTemplateAssets(templateId);
      return NextResponse.json(assets);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Unable to load template" }, { status: 404 });
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const websites = await Website.find({ user: session.user.email })
    .sort({ createdAt: -1 })
    .lean<WebsiteModel & {
      _id: Types.ObjectId | string;
      createdAt?: Date;
      updatedAt?: Date;
    }>();

  const sanitizedWebsites: DashboardWebsite[] = websites.map((website) => {
    const { _id, createdAt, updatedAt, ...rest } = website;
    const normalizedId =
      typeof _id === "string"
        ? _id
        : typeof _id?.toString === "function"
          ? _id.toString()
          : String(_id);

    return {
      ...rest,
      _id: normalizedId,
      createdAt:
        createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      updatedAt:
        updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
    } satisfies DashboardWebsite;
  });

  return NextResponse.json({ websites: sanitizedWebsites });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const templateId = typeof body?.templateId === "string" ? body.templateId.trim() : "";

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    await connectDB();

    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };

    const website = await Website.create({
      name: template.name,
      templateId: template.id,
      userId: sessionWithId.userId,
      user: session.user.email,
      status: "draft",
      plan: "free",
      theme: {
        colors: {
          primary: "#3B82F6",
          secondary: "#10B981",
          background: "#FFFFFF",
          text: "#1F2937",
        },
        fonts: {},
      },
    });

    return NextResponse.json(website.toJSON(), { status: 201 });
  } catch (error) {
    console.error("Failed to create website:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
