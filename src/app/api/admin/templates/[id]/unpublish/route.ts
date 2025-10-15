import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    const updated = await Template.findByIdAndUpdate(
      id,
      { published: false },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to unpublish template ${id}`, error);
    return NextResponse.json({ error: "Failed to unpublish template" }, { status: 500 });
  }
}

function isCastError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "CastError");
}
