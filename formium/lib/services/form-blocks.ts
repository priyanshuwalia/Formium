import { prisma } from "../prisma";
import type { BlockType } from "@prisma/client";

export const createFormBlock = async (data: {
  formId: string;
  type: BlockType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: any;
  logic?: any;
  order: number;
}) => {
  return prisma.formBlock.create({ data });
};

export const getBlocksByFormId = async (formId: string) => {
  return prisma.formBlock.findMany({
    where: { formId },
    orderBy: { order: "asc" },
  });
};

export const updateBlockById = async (
  blockId: string,
  userId: string,
  data: {
    type?: BlockType;
    label?: string;
    required?: boolean;
    placeholder?: string;
    options?: any;
    logic?: any;
    order?: number;
  },
) => {
  return prisma.formBlock.updateMany({
    where: { id: blockId, form: { userId } },
    data,
  });
};

export const deleteBlockById = async (blockId: string, userId: string) => {
  return prisma.formBlock.deleteMany({
    where: { id: blockId, form: { userId } },
  });
};