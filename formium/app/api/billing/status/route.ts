import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/lib/stripe";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      planStatus: true,
      planRenewsAt: true,
      _count: { select: { forms: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limits = getLimits(user.plan);
  return NextResponse.json({
    plan: user.plan,
    planStatus: user.planStatus,
    planRenewsAt: user.planRenewsAt,
    limits,
    usage: { forms: user._count.forms },
  });
}