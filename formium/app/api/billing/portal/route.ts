import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillingPortalSession, isBillingConfigured } from "@/lib/stripe";

export async function POST() {
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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active Stripe customer" },
      { status: 400 },
    );
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const url = await createBillingPortalSession(
      user.stripeCustomerId,
      `${base}/settings`,
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Stripe portal failed:", err);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}