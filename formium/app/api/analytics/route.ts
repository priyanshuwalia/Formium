import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/services/analytics";
import { apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  try {
    const analytics = await getAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to fetch analytics", 500);
  }
}