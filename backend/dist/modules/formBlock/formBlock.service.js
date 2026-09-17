import prisma from "../../config/db.js";
import { Prisma } from "@prisma/client";
const withLogic = (data) => {
    const { logic, ...rest } = data;
    if (logic === undefined)
        return rest;
    return { ...rest, logic: logic === null ? Prisma.JsonNull : logic };
};
export const createFormBlock = async (data) => {
    return await prisma.formBlock.create({ data: withLogic(data) });
};
export const getBlocksByFormId = async (formId) => {
    return await prisma.formBlock.findMany({ where: { formId }, orderBy: { order: "asc" } });
};
export const updateBlockById = async (blockId, userId, data) => {
    return await prisma.formBlock.updateMany({
        where: { id: blockId, form: { userId, } },
        data: withLogic(data),
    });
};
export const deleteBlockById = async (blockId, userId) => {
    return await prisma.formBlock.deleteMany({
        where: {
            id: blockId,
            form: {
                userId,
            },
        },
    });
};
