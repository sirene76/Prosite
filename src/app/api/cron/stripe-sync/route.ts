import { NextRequest, NextResponse } from "next/server";

import { syncStripeSubscriptions } from "@/lib/stripeSync";

function isAuthorized(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  return secret && secret === process.env.CRON_SECRET;
}

async function handleRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncStripeSubscriptions();
    const status = result.errors.length > 0 ? 207 : 200;

    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("Stripe sync failed", error);
    return NextResponse.json(
      { error: "Stripe sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}
