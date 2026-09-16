import { NextRequest, NextResponse } from "next/server";
import {
  getBlocksByFormId,
  updateBlockById,
  deleteBlockById,
} from "@/lib/services/form-blocks";
import { updateFormBlockSchema, apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const blocks = await getBlocksByFormId(id);
    if (!blocks || blocks.length === 0) {
      return apiError("No blocks found", 404);
    }
    return NextResponse.json(blocks);
  } catch (err: any) {
    return apiError(err.message || "Failed to fetch blocks", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateFormBlockSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  try {
    const updated = await updateBlockById(id, userId, parsed.data as any);
    if (updated.count === 0) {
      return apiError("Block not found or unauthorized", 404);
    }
    return NextResponse.json({ message: "Block updated successfully" });
  } catch (err: any) {
    return apiError(err.message || "Failed to update block", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { id } = await params;
  try {
    const deleted = await deleteBlockById(id, userId);
    if (deleted.count === 0) {
      return apiError("Block not found or unauthorized", 404);
    }
    return NextResponse.json({ message: "Block deleted successfully" });
  } catch (err: any) {
    return apiError(err.message || "Failed to delete block", 500);
  }
}