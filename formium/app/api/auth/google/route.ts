import { NextRequest, NextResponse } from "next/server";
import { googleLogin, AuthError } from "@/lib/services/auth";
import { googleSchema, apiError } from "@/lib/validations";
import { setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = googleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Google access token is required");
    }

    const user = await googleLogin(parsed.data.accessToken);
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
    console.error("Google login error:", err);
    return apiError("Google login failed", 500);
  }
}