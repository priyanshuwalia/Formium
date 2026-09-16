import { NextRequest, NextResponse } from "next/server";
import { getResponseById } from "@/lib/services/responses";
import { apiError } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const response = await getResponseById(id);
    if (!response) return apiError("Response not found", 404);
    return NextResponse.json(response);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch response details", 500);
  }
}