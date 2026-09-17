import { NextResponse } from "next/server";
import { getFormsByUserId } from "@/lib/services/forms";
import { apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  try {
    const forms = await getFormsByUserId(userId);
    return NextResponse.json(forms);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to fetch forms", 500);
  }
}