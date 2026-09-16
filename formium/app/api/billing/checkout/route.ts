import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId, requireUser } from "@/lib/auth";
import { createCheckoutSession, isBillingConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured" },
      { status: 503 },
    );
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const url = await createCheckoutSession(
      user.email,
      `${base}/settings?upgrade=success`,
      `${base}/settings?upgrade=cancelled`,
    );
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Stripe checkout failed:", err);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}