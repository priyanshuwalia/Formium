import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import type { BlockType } from "@prisma/client";

export const createFormBlock = async (data: {
  formId: string;
  type: BlockType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: (string | number)[];
  logic?: { triggerBlockId: string; triggerValue: string }[] | null;
  order: number;
}) => {
  const { logic, ...rest } = data;
  return prisma.formBlock.create({
    data: {
      ...rest,
      logic: logic === null ? Prisma.JsonNull : logic,
    },
  });
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
    options?: (string | number)[];
    logic?: { triggerBlockId: string; triggerValue: string }[] | null;
    order?: number;
  },
) => {
  const { logic, ...rest } = data;
  return prisma.formBlock.updateMany({
    where: { id: blockId, form: { userId } },
    data: {
      ...rest,
      logic: logic === null ? Prisma.JsonNull : logic,
    },
  });
};

export const deleteBlockById = async (blockId: string, userId: string) => {
  return prisma.formBlock.deleteMany({
    where: { id: blockId, form: { userId } },
  });
};