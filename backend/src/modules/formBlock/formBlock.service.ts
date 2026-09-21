import prisma from "../../config/db.js";
import { BlockType, Prisma } from "@prisma/client";

type BlockData = {
    formId: string;
    type: BlockType;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    logic?: Prisma.InputJsonValue | null;
    order: number;
};

const withLogic = <T extends { logic?: Prisma.InputJsonValue | null }>(data: T) => {
    const { logic, ...rest } = data;
    if (logic === undefined) return rest;
    return { ...rest, logic: logic === null ? Prisma.JsonNull : logic };
};

export class FormBlockError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.name = "FormBlockError";
        this.status = status;
    }
}

export const createFormBlock = async (userId: string, data: BlockData) => {
    const owned = await prisma.form.findFirst({
        where: { id: data.formId, userId },
        select: { id: true },
    });
    if (!owned) {
        throw new FormBlockError("Form not found", 404);
    }
    return await prisma.formBlock.create({ data: withLogic(data) });
}
export const getBlocksByFormId = async (formId: string) => {
    return await prisma.formBlock.findMany({ where: { formId }, orderBy: { order: "asc" } })
}
export const updateBlockById = async (
    blockId: string, userId: string,
    data: {
        label?: string
        type?: BlockType;
        required?: boolean;
        placeholder?: string;
        options?: Prisma.InputJsonValue;
        logic?: Prisma.InputJsonValue | null;
        order?: number;
    }

) => {
    return await prisma.formBlock.updateMany({
        where: { id: blockId, form: { userId, } },
        data: withLogic(data) as Prisma.FormBlockUpdateManyMutationInput,
    })
}
export const deleteBlockById = async (blockId: string, userId: string) => {
    return await prisma.formBlock.deleteMany({
        where: {
            id: blockId,
            form: {
                userId,
            },
        },
    });
};
