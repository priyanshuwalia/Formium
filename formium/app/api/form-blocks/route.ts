import { NextRequest, NextResponse } from "next/server";
import { createFormBlock } from "@/lib/services/form-blocks";
import { createFormBlockSchema, apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = createFormBlockSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  try {
    const block = await createFormBlock(parsed.data as any);
    return NextResponse.json(block, { status: 201 });
  } catch (err: any) {
    return apiError(err.message || "Failed to create block", 500);
  }
}