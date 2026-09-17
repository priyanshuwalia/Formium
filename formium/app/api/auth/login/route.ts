import { NextRequest, NextResponse } from "next/server";
import { loginUser, AuthError } from "@/lib/services/auth";
import { loginSchema, apiError } from "@/lib/validations";
import { setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input");
    }

    const user = await loginUser(parsed.data.email, parsed.data.password);
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        bio: user.bio ?? undefined,
        profilePicture: user.profilePicture ?? undefined,
      },
    });
    await setAuthCookies(user.id);
    return res;
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, 401);
    console.error("Login error:", err);
    return apiError("Login failed", 500);
  }
}