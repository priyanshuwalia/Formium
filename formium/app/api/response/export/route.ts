import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const escapeCsv = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export async function GET(req: NextRequest) {
  const formId = req.nextUrl.searchParams.get("formId");
  if (!formId) {
    return NextResponse.json({ error: "Missing formId query param" }, { status: 400 });
  }

  try {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { blocks: { orderBy: { order: "asc" } } },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const responses = await prisma.response.findMany({
      where: { formId },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    const blocks = form.blocks;
    const headers = blocks.map((b) => b.label || "Untitled");

    const rows = responses.map((response) => {
      const byBlockId: Record<string, string> = {};
      response.items.forEach((item) => {
        if (!(item.blockId in byBlockId)) {
          byBlockId[item.blockId] = item.value;
        }
      });
      return blocks.map((block) => byBlockId[block.id] ?? "");
    });

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const safeTitle = form.title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    const filename = `${safeTitle || "form"}-responses.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("CSV export failed:", err);
    return NextResponse.json({ error: err.message || "Failed to export responses" }, { status: 500 });
  }
}