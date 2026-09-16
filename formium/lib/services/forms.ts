import { prisma } from "../prisma";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", 5);

export const generateSlug = (title: string) => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${baseSlug}-${nanoid()}`;
};

export const createForm = async (data: {
  title: string;
  description?: string;
  isPublished?: boolean;
  theme?: string;
  successText?: string;
  userId: string;
}) => {
  let slug = generateSlug(data.title);
  let exists = await prisma.form.findUnique({ where: { slug } });

  while (exists) {
    slug = generateSlug(data.title);
    exists = await prisma.form.findUnique({ where: { slug } });
  }

  return prisma.form.create({
    data: { ...data, slug, isPublished: data.isPublished ?? false },
  });
};

export const getFormBySlug = async (slug: string) => {
  return prisma.form.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
};

export const getFormById = async (id: string) => {
  return prisma.form.findUnique({
    where: { id },
    include: {
      blocks: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });
};

export const getFormsByUserId = async (userId: string) => {
  return prisma.form.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      blocks: true,
      _count: { select: { responses: true } },
    },
  });
};

export const updateFormById = async (
  formId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    isPublished?: boolean;
    theme?: string;
    successText?: string;
  },
) => {
  return prisma.form.updateMany({ where: { id: formId, userId }, data });
};

export const deleteFormById = async (formId: string, userId: string) => {
  return prisma.form.deleteMany({ where: { id: formId, userId } });
};