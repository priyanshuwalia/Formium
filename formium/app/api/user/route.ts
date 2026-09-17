import { NextRequest, NextResponse } from "next/server";
import { updateUserSchema, apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, email: true, name: true, bio: true, profilePicture: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to update profile", 500);
  }
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to delete account", 500);
  }
}