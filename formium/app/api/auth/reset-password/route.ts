import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { apiError } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  verifyPasswordResetToken,
  passwordFingerprint,
  setAuthCookies,
} from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(5),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  const payload = await verifyPasswordResetToken(parsed.data.token);
  if (!payload) {
    return apiError("This reset link is invalid or has expired", 400);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || passwordFingerprint(user.password) !== payload.fp) {
      return apiError("This reset link is invalid or has expired", 400);
    }

    const hashed = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Log the user straight in after a successful reset
    const res = NextResponse.json({ message: "Password updated" });
    await setAuthCookies(user.id);
    return res;
  } catch (err) {
    console.error("Reset password error:", err);
    return apiError("Unable to reset password", 500);
  }
}