import prisma from "../../config/db.js";
import { summarizeResponses } from "../../lib/ai.js";
import { ApiError, asyncHandler } from "../../utils/errors.js";
export const analyzeForm = asyncHandler(async (req, res) => {
    const formId = typeof req.query.formId === "string" ? req.query.formId : undefined;
    if (!formId)
        throw new ApiError("Missing formId", 400);
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
    if (!form || form.userId !== req.user.id) {
        throw new ApiError("Form not found", 404);
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
    res.json({ result });
});
