import { NextRequest, NextResponse } from "next/server";
import {
  getFormBySlug,
  getFormById,
  updateFormById,
  deleteFormById,
} from "@/lib/services/forms";
import { updateFormSchema, apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";

async function resolveForm(param: string) {
  const bySlug = await getFormBySlug(param);
  if (bySlug) return { id: bySlug.id, userId: bySlug.userId };
  const byId = await getFormById(param);
  if (byId) return { id: byId.id, userId: byId.userId };
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const form = await getFormBySlug(slug);
    if (!form) return apiError("Form not found", 404);
    return NextResponse.json(form);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to fetch form", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { slug } = await params;
  const resolved = await resolveForm(slug);
  if (!resolved || resolved.userId !== userId) {
    return apiError("Not found or unauthorized", 404);
  }

  const body = await req.json().catch(() => null);
  const parsed = updateFormSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  try {
    await updateFormById(resolved.id, userId, parsed.data);
    return NextResponse.json({ message: "Form updated successfully" });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to update form", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const { slug } = await params;
  const resolved = await resolveForm(slug);
  if (!resolved || resolved.userId !== userId) {
    return apiError("Form not found or unauthorized", 404);
  }

  try {
    await deleteFormById(resolved.id, userId);
    return NextResponse.json({ message: "Form deleted successfully" });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to delete form", 500);
  }
}