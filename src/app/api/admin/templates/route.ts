import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const templates = await Template.find().sort({ createdAt: -1 }).lean();

  const serialized = templates.map((template) => ({
    ...template,
    _id: template._id.toString(),
    createdAt:
      template.createdAt instanceof Date
        ? template.createdAt.toISOString()
        : template.createdAt,
    updatedAt:
      template.updatedAt instanceof Date
        ? template.updatedAt.toISOString()
        : template.updatedAt,
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const template = await Template.create({
    ...body,
    createdBy: session.user.id,
    published: true,
  });
  return NextResponse.json(template);
}
