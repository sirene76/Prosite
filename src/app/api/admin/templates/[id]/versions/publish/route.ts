import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { Template } from "@/models/template";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { version } = (await req.json()) as { version?: string };
    if (!version) {
      return NextResponse.json({ error: "Version is required" }, { status: 400 });
    }

    const template = await Template.findById(params.id);
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const targetVersion = template.versions.find((v) => v.number === version);
    if (!targetVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    targetVersion.status = "published";
    template.currentVersion = targetVersion.number;
    await template.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to publish version for template ${params.id}`, error);
    return NextResponse.json({ error: "Failed to publish version" }, { status: 500 });
  }
}
