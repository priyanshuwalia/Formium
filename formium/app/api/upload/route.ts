import { NextRequest, NextResponse } from "next/server";
import { createUploadUrl, isUploadConfigured } from "@/lib/storage/r2";
import { getLimits } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const uploadSchema = z.object({
  formId: z.string().min(1).max(100),
  filename: z.string().min(1).max(300),
  contentType: z.string().min(1).max(150),
});

export async function POST(req: NextRequest) {
  if (!isUploadConfigured()) {
    return NextResponse.json(
      { error: "File uploads are not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  const { formId, filename, contentType } = parsed.data;

  // Response uploads are public (anonymous respondents), but gated by the
  // form owner's plan.
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { User: { select: { plan: true } } },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  if (!getLimits(form.User?.plan || "FREE").fileUploads) {
    return NextResponse.json(
      { error: "File uploads require the Pro plan" },
      { status: 403 },
    );
  }

  // Sanitize filename; scope key per form to prevent cross-form traversal
  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^\.+/, "");
  const key = `uploads/${form.userId}/${formId}/${Date.now()}-${safeName}`;

  try {
    const uploadUrl = await createUploadUrl(key, contentType);
    return NextResponse.json({ uploadUrl, key });
  } catch (err: any) {
    console.error("Failed to create upload URL:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }
}