import { Request, Response } from "express";
import prisma from "../../config/db.js";
import { summarizeResponses } from "../../lib/ai.js";
import { ApiError, asyncHandler } from "../../utils/errors.js";

// Free tier gets a taste of the wedge feature — 3 analyses per calendar month.
// Pro is unlimited.
const FREE_AI_LIMIT = 3;

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getAiQuota = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { plan: true },
  });
  const plan = user?.plan || "FREE";
  const limit = plan === "FREE" ? FREE_AI_LIMIT : Infinity;

  const used = await prisma.aiUsage.count({
    where: { userId: req.user.id, createdAt: { gte: startOfMonth() } },
  });

  res.json({
    plan,
    used,
    limit: limit === Infinity ? null : limit,
    remaining: limit === Infinity ? null : Math.max(limit - used, 0),
  });
});

export const analyzeForm = asyncHandler(async (req: Request, res: Response) => {
  const formId = typeof req.query.formId === "string" ? req.query.formId : undefined;
  if (!formId) throw new ApiError("Missing formId", 400);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      User: { select: { plan: true } },
      blocks: { orderBy: { order: "asc" } },
      responses: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!form || form.userId !== req.user.id) {
    throw new ApiError("Form not found", 404);
  }

  // Plan gate — this is the Anthropic spend meter.
  const plan = form.User?.plan || "FREE";
  const limit = plan === "FREE" ? FREE_AI_LIMIT : Infinity;
  let monthUsed = 0;
  if (limit !== Infinity) {
    monthUsed = await prisma.aiUsage.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: startOfMonth() },
      },
    });
    if (monthUsed >= limit) {
      throw new ApiError(
        "You've used all 3 AI analyses for this month. Upgrade to Pro for unlimited insights.",
        403,
      );
    }
  }

  const itemsByLabel = form.blocks.map((block) => ({
    label: block.label,
    items: form.responses
      .map((r) => r.items.find((i) => i.blockId === block.id)?.value || "")
      .filter(Boolean),
  }));

  const result = await summarizeResponses(form.title, itemsByLabel);
  if (!result) {
    throw new ApiError("AI is not configured (set ANTHROPIC_API_KEY)", 503);
  }

  // Charge the analysis only on success.
  await prisma.aiUsage.create({ data: { userId: req.user.id, formId: form.id } });

  const newUsed = monthUsed + 1;

  res.json({
    result,
    quota: {
      plan,
      used: plan === "FREE" ? newUsed : null,
      remaining: plan === "FREE" ? Math.max(FREE_AI_LIMIT - newUsed, 0) : null,
    },
  });
});