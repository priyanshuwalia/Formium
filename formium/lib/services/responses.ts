import { prisma } from "../prisma";

export const createResponse = async (
  formId: string,
  items: { blockId: string; value: string }[],
) => {
  return prisma.response.create({
    data: {
      formId,
      items: { createMany: { data: items } },
    },
    include: { items: true },
  });
};

export const getResponseByForm = async (formId: string) => {
  return prisma.response.findMany({ where: { formId }, include: { items: true } });
};

export const getResponseById = async (id: string) => {
  return prisma.response.findUnique({
    where: { id },
    include: {
      items: true,
      form: { include: { blocks: { orderBy: { order: "asc" } } } },
    },
  });
};