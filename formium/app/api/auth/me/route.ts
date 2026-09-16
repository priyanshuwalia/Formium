import { NextResponse } from "next/server";
import { apiError } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  return NextResponse.json({ user });
}