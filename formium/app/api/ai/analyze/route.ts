import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeResponses } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formId = req.nextUrl.searchParams.get("formId");
  if (!formId) return NextResponse.json({ error: "Missing formId" }, { status: 400 });

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      blocks: { orderBy: { order: "asc" } },
      responses: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!form || form.userId !== userId) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const itemsByLabel = form.blocks.map((block) => ({
    label: block.label,
    items: form.responses
      .map((r) => r.items.find((i) => i.blockId === block.id)?.value || "")
      .filter(Boolean),
  }));

  try {
    const result = await summarizeResponses(form.title, itemsByLabel);
    if (!result) {
      return NextResponse.json(
        { error: "AI is not configured (set ANTHROPIC_API_KEY)" },
        { status: 503 },
      );
    }
    return NextResponse.json({ result });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}