import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/services/auth";
import { registerSchema, apiError } from "@/lib/validations";
import { setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input");
    }

    const user = await registerUser(parsed.data.email, parsed.data.password);
    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          bio: user.bio ?? undefined,
          profilePicture: user.profilePicture ?? undefined,
        },
      },
      { status: 201 },
    );
    await setAuthCookies(user.id);
    return res;
  } catch (err: any) {
    return apiError(err.message || "Registration failed", 400);
  }
}