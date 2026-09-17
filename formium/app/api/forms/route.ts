import { NextRequest, NextResponse } from "next/server";
import { createForm } from "@/lib/services/forms";
import { createFormSchema, apiError } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth";
import { getLimits } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const parsed = createFormSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = user?.plan || "FREE";

    if (plan === "FREE") {
      const formCount = await prisma.form.count({ where: { userId } });
      const limit = getLimits("FREE").forms;
      if (formCount >= limit) {
        return apiError(
          "Free plan allows up to 3 forms. Upgrade to Pro to create more.",
          403,
        );
      }
    }

    const form = await createForm({ ...parsed.data, userId });
    return NextResponse.json(form, { status: 201 });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Failed to create form", 500);
  }
}