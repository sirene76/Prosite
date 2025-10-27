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

type ThemeUpdatePayload = {
  name?: string;
  label?: string;
  colors?: Record<string, string> | Map<string, string>;
  fonts?: Record<string, string> | Map<string, string>;
  [key: string]: unknown;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Unauthorized update attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }
    const updates = (await req.json()) as {
      theme?: ThemeUpdatePayload;
      content?: Record<string, unknown> | Map<string, unknown>;
      values?: Record<string, unknown> | Map<string, unknown>;
      name?: string;
      [key: string]: unknown;
    };
    console.log("PATCH incoming:", updates);
    await connectDB();

    const website = await Website.findById(id);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };
    if (website.userId && sessionWithId.userId && String(website.userId) !== sessionWithId.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (updates.theme && typeof updates.theme === "object") {
      const existingThemeRaw = website.theme
        ? typeof (website.theme as unknown as { toObject?: () => unknown }).toObject === "function"
          ? (website.theme as unknown as { toObject: () => unknown }).toObject()
          : website.theme
        : {};
      const existingTheme = existingThemeRaw as ThemeUpdatePayload;

      const mergedTheme: ThemeUpdatePayload = {
        ...existingTheme,
        ...updates.theme,
      };

      if (updates.theme.colors && typeof updates.theme.colors === "object") {
        const currentColors = existingTheme.colors instanceof Map
          ? Object.fromEntries(existingTheme.colors as Map<string, string>)
          : (existingTheme.colors as Record<string, string> | undefined) ?? {};
        const incomingColors = updates.theme.colors instanceof Map
          ? Object.fromEntries(updates.theme.colors as Map<string, string>)
          : (updates.theme.colors as Record<string, string>);
        mergedTheme.colors = {
          ...currentColors,
          ...incomingColors,
        };
      }

      if (updates.theme.fonts && typeof updates.theme.fonts === "object") {
        const currentFonts = existingTheme.fonts instanceof Map
          ? Object.fromEntries(existingTheme.fonts as Map<string, string>)
          : (existingTheme.fonts as Record<string, string> | undefined) ?? {};
        const incomingFonts = updates.theme.fonts instanceof Map
          ? Object.fromEntries(updates.theme.fonts as Map<string, string>)
          : (updates.theme.fonts as Record<string, string>);
        mergedTheme.fonts = {
          ...currentFonts,
          ...incomingFonts,
        };
      }

      website.theme = mergedTheme;
    }
    if (updates.content && typeof updates.content === "object") {
      const currentContent = website.content instanceof Map
        ? Object.fromEntries(website.content as Map<string, unknown>)
        : (website.content as Record<string, unknown> | undefined) ?? {};
      const incomingContent = updates.content instanceof Map
        ? Object.fromEntries(updates.content as Map<string, unknown>)
        : (updates.content as Record<string, unknown>);
      website.content = {
        ...currentContent,
        ...incomingContent,
      };
    }
    if (updates.values && typeof updates.values === "object") {
      const currentValues = website.values instanceof Map
        ? Object.fromEntries(website.values as Map<string, unknown>)
        : (website.values as Record<string, unknown> | undefined) ?? {};
      const incomingValues = updates.values instanceof Map
        ? Object.fromEntries(updates.values as Map<string, unknown>)
        : (updates.values as Record<string, unknown>);
      website.values = {
        ...currentValues,
        ...incomingValues,
      };
    }
    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      website.name = updates.name;
    }

    website.updatedAt = new Date();
    await website.save();

    return NextResponse.json(website);
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
