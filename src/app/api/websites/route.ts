import { NextResponse } from "next/server";
import type { Types } from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website, { type WebsiteModel } from "@/models/Website";
import { getTemplateAssets } from "@/lib/templates";
import type { DashboardWebsite } from "@/types/website";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("templateId");

  // ✅ Handle /api/websites?templateId=... to load template assets
  if (templateId) {
    try {
      const assets = await getTemplateAssets(templateId);
      if (!assets) {
        return NextResponse.json({ error: "Unable to load template" }, { status: 404 });
      }
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

      const { previewImage, ...restWithoutPreviewImage } = rest;

      return {
        ...restWithoutPreviewImage,
        _id: normalizedId,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
        // ✅ Normalize null → undefined
        thumbnailUrl: website.thumbnailUrl ?? undefined,
        previewImage: previewImage ?? undefined,
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

  const { templateId } = (await request.json()) as { templateId?: string };
  if (!templateId || typeof templateId !== "string" || !templateId.trim()) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  // ✅ Fetch template assets
  const assets = await getTemplateAssets(templateId.trim());
  if (!assets) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  try {
    const { template, html, css, meta } = assets;
    const metaRecord = isRecord(meta) ? meta : {};
    const metaTheme = isRecord(metaRecord.theme) ? metaRecord.theme : {};
    const metaFields = Array.isArray(metaRecord.fields) ? metaRecord.fields : [];

    // ✅ Build default values from meta.fields
    const defaultValues: Record<string, unknown> = {};
    for (const field of metaFields) {
      const key = typeof field.id === "string" ? field.id.trim() : "";
      if (!key) continue;
      defaultValues[key] = field.default ?? "";
    }

    // ✅ Add branding defaults to values
    defaultValues["websiteTitle"] = template.name ?? "Untitled Website";
    defaultValues["businessName"] = "";
    defaultValues["logoUrl"] = "";

    // ✅ Build theme safely (ensure all keys exist)
    const theme = {
      name: metaTheme.name ?? "default",
      label: metaTheme.label ?? null,
      colors: metaTheme.colors ?? {},
      fonts: metaTheme.fonts ?? {}, // added support
    };

    // ✅ Create website document with both content + values
    const website = await Website.create({
      name: template.name,
      templateId: template._id,
      user: session.user.email,
      userEmail: session.user.email,
      status: "preview",
      plan: "Free",
      html,
      css,
      meta: metaRecord,
      theme,
      content: {
        websiteTitle: defaultValues["websiteTitle"],
        businessName: defaultValues["businessName"],
        logoUrl: defaultValues["logoUrl"],
        other: {},
      },
      values: defaultValues, // ✅ store full content tree
      pages: ["Home"],
    });

    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error("❌ Failed to create website:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
