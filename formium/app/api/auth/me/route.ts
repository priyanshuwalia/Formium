import { NextResponse } from "next/server";
import { apiError } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    return NextResponse.json({ user });
  } catch (err) {
    console.error("Get current user error:", err);
    return apiError("Unable to load user", 500);
  }
}