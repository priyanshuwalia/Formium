import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    form: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("nanoid", () => ({
  customAlphabet: () => () => "abcde",
}));

import { generateSlug, createForm } from "@/lib/services/forms";

describe("forms service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generateSlug slugifies and appends a short id", () => {
    const slug = generateSlug("My Cool Form!");
    expect(slug).toBe("my-cool-form-abcde");
  });

  it("generateSlug handles empties/overflow with a slug", () => {
    const slug = generateSlug("---   Hello WORLD 2024 ---");
    expect(slug).toBe("hello-world-2024-abcde");
  });

  it("createForm retries on slug collision then creates", async () => {
    mocks.prisma.form.findUnique
      .mockResolvedValueOnce({ id: "existing" }) // first slug taken
      .mockResolvedValueOnce(null); // second slug free
    mocks.prisma.form.create.mockImplementation(async ({ data }) => ({
      id: "f1",
      ...data,
    }));

    const form = await createForm({
      title: "Survey",
      userId: "u1",
    });

    expect(mocks.prisma.form.findUnique).toHaveBeenCalledTimes(2);
    expect(form.slug).toBe("survey-abcde");
    expect(mocks.prisma.form.create).toHaveBeenCalled();
  });

  it("createForm passes through all fields", async () => {
    mocks.prisma.form.findUnique.mockResolvedValue(null);
    mocks.prisma.form.create.mockImplementation(async ({ data }) => ({
      id: "f1",
      ...data,
    }));

    await createForm({
      title: "Survey",
      description: "A survey",
      isPublished: true,
      theme: "indigo",
      successText: "Thanks!",
      userId: "u1",
    });

    expect(mocks.prisma.form.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Survey",
        description: "A survey",
        isPublished: true,
        theme: "indigo",
        successText: "Thanks!",
        userId: "u1",
      }),
    });
  });
});