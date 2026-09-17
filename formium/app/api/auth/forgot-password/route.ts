import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { signPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("A valid email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  }).catch((err) => {
    console.error("Forgot password lookup error:", err);
    return null;
  });

  // Always return success to avoid leaking which emails are registered
  if (user) {
    const token = await signPasswordResetToken(user.id, user.password);
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  return NextResponse.json({
    message: "If that email is registered, a reset link has been sent.",
  });
}