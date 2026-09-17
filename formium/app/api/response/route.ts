import { NextRequest, NextResponse } from "next/server";
import { createResponse } from "@/lib/services/responses";
import { createResponseSchema, apiError } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { sendNewResponseNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createResponseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input");
  }

  try {
    const response = await createResponse(
      parsed.data.formId,
      parsed.data.items,
    );

    // Fire-and-forget notification to the form owner
    const form = await prisma.form.findUnique({
      where: { id: parsed.data.formId },
      include: { User: { select: { email: true } } },
    });

    if (form?.User?.email) {
      const count = await prisma.response.count({
        where: { formId: form.id },
      });
      sendNewResponseNotification(
        form.User.email,
        form.title,
        form.slug,
        count,
      ).catch((err) => console.error("Response notification failed:", err));
    }

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Couldn't submit response", 500);
  }
}