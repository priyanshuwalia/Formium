import prisma from "../../config/db.js";
import { getLimits } from "../../lib/stripe.js";
import { sendNewResponseNotification } from "../../lib/email.js";

export class ResponseError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.name = "ResponseError";
        this.status = status;
    }
}

const startOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

type LogicRule = { triggerBlockId: string; triggerValue: string };

/** Mirrors the public form's conditional visibility so hidden blocks aren't required. */
const isBlockVisible = (
    block: { logic: unknown },
    items: { blockId: string; value: string }[],
) => {
    const rules = block.logic as LogicRule[] | null;
    if (!rules || rules.length === 0) return true;
    return rules.some((rule) => {
        const answer = items.find((i) => i.blockId === rule.triggerBlockId)?.value || "";
        return answer.toLowerCase() === rule.triggerValue.toLowerCase();
    });
};

export const createResponse = async (
    formId: string,
    items: { blockId: string; value: string }[],
) => {
    const form = await prisma.form.findUnique({
        where: { id: formId },
        include: {
            User: { select: { id: true, email: true, plan: true } },
            blocks: { select: { id: true, required: true, label: true, logic: true } },
        },
    });

    if (!form) throw new ResponseError("Form not found", 404);

    const missing = form.blocks.filter(
        (b) =>
            b.required &&
            isBlockVisible(b, items) &&
            !items.some((i) => i.blockId === b.id && i.value !== ""),
    );
    if (missing.length > 0) {
        throw new ResponseError("Please fill in all required fields", 400);
    }

    // Enforce the form owner's monthly response quota
    if (form.User) {
        const limits = getLimits(form.User.plan || "FREE");
        if (limits.responsesPerMonth !== Infinity) {
            const count = await prisma.response.count({
                where: {
                    form: { userId: form.User.id },
                    createdAt: { gte: startOfMonth() },
                },
            });
            if (count >= limits.responsesPerMonth) {
                throw new ResponseError(
                    "This form has reached its monthly response limit",
                    403,
                );
            }
        }
    }

    const response = await prisma.response.create({
        data: {
            formId,
            items: { createMany: { data: items } },
        },
        include: { items: true },
    });

    // Fire-and-forget notification to the form owner
    if (form.User?.email) {
        const count = await prisma.response.count({ where: { formId: form.id } });
        sendNewResponseNotification(form.User.email, form.title, form.slug, count).catch(
            (err) => console.error("Response notification failed:", err),
        );
    }

    return response;
};

export const getResponseByForm = async (formId: string, userId: string) => {
    const form = await prisma.form.findFirst({
        where: { id: formId, userId },
        select: { id: true },
    });
    if (!form) throw new ResponseError("Form not found", 404);
    return prisma.response.findMany({ where: { formId }, include: { items: true } })
}

export const getResponseById = async (id: string, userId: string) => {
    const response = await prisma.response.findUnique({
        where: { id },
        include: {
            items: true,
            form: {
                include: {
                    blocks: {
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    });
    if (!response || response.form.userId !== userId) {
        throw new ResponseError("Response not found", 404);
    }
    return response;
}

const escapeCsv = (value: string): string => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
};

export const buildResponsesCsv = async (formId: string) => {
    const form = await prisma.form.findUnique({
        where: { id: formId },
        include: { blocks: { orderBy: { order: "asc" } } },
    });
    if (!form) throw new ResponseError("Form not found", 404);

    const responses = await prisma.response.findMany({
        where: { formId },
        include: { items: true },
        orderBy: { createdAt: "asc" },
    });

    const headers = form.blocks.map((b) => b.label || "Untitled");

    const rows = responses.map((response) => {
        const byBlockId: Record<string, string> = {};
        response.items.forEach((item) => {
            if (!(item.blockId in byBlockId)) byBlockId[item.blockId] = item.value;
        });
        return form.blocks.map((block) => byBlockId[block.id] ?? "");
    });

    const csv = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const safeTitle = form.title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    return { csv, filename: `${safeTitle || "form"}-responses.csv` };
};
