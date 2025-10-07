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

  // ✅ Handle /api/websites?templateId=... to load template assets
  if (templateId) {
    try {
      const assets = await getTemplateAssets(templateId);
      return NextResponse.json(assets);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Unable to load template" }, { status: 404 });
    }
  }

  // ✅ Ensure user is logged in
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // ✅ Explicit array typing for lean()
const websites = (await Website.find({ user: session.user.email })
  .sort({ createdAt: -1 })
  .lean()) as unknown as (WebsiteModel & {
  _id: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
})[];



  // ✅ Explicit map parameter typing
  const sanitizedWebsites: DashboardWebsite[] = websites.map(
    (website: WebsiteModel & { _id: Types.ObjectId | string }) => {
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
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      } satisfies DashboardWebsite;
    }
  );

  return NextResponse.json({ websites: sanitizedWebsites });
}

export async function POST(request: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = await request.json();

  if (typeof templateId !== "string" || !templateId.trim()) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  const template = await getTemplateById(templateId.trim());
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  try {
    const website = await Website.create({
      name: template.name,
      templateId: template.id,
      user: session.user.email,
      status: "draft",
      plan: "free",
    });

    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error("Failed to create website:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
