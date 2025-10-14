import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

export async function GET() {
  await connectDB();
  const templates = await Template.find().lean();
  return NextResponse.json({ templates });
}
