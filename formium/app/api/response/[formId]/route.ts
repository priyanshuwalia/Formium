import { NextRequest, NextResponse } from "next/server";
import { getResponseByForm } from "@/lib/services/responses";
import { apiError } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  const { formId } = await params;
  try {
    const responses = await getResponseByForm(formId);
    return NextResponse.json(responses);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to fetch responses", 500);
  }
}