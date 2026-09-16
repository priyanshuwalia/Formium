import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createFormSchema,
  createResponseSchema,
  createFormBlockSchema,
} from "@/lib/validations";

describe("zod validations", () => {
  it("register requires valid email and strong password", () => {
    expect(registerSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ email: "a@b.com", password: "long-enough-pw" }).success,
    ).toBe(true);
  });

  it("createForm requires a title and defaults isPublished to false", () => {
    const r = createFormSchema.safeParse({ title: "  " });
    expect(r.success).toBe(false);

    const ok = createFormSchema.safeParse({ title: "My Form" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.isPublished).toBe(false);
  });

  it("createResponse requires formId and items", () => {
    expect(createResponseSchema.safeParse({ formId: "f1", items: [] }).success).toBe(true);
    expect(createResponseSchema.safeParse({ formId: "f1" }).success).toBe(false);
    expect(
      createResponseSchema.safeParse({ formId: "f1", items: [{ blockId: "b1", value: "x" }] }).success,
    ).toBe(true);
  });

  it("createFormBlock requires type, label, order", () => {
    const good = createFormBlockSchema.safeParse({
      formId: "f1",
      type: "SHORT_ANS",
      label: "Name",
      required: true,
      order: 0,
    });
    expect(good.success).toBe(true);

    const bad = createFormBlockSchema.safeParse({
      formId: "f1",
      type: "NOT_A_TYPE",
      label: "Name",
      required: true,
      order: 0,
    });
    expect(bad.success).toBe(false);
  });
});

describe("plan limits", () => {
  it("FREE is limited, PRO is unlimited", async () => {
    const { getLimits } = await import("@/lib/stripe");
    expect(getLimits("FREE").forms).toBe(3);
    expect(getLimits("FREE").fileUploads).toBe(false);
    expect(getLimits("PRO").forms).toBe(Infinity);
    expect(getLimits("PRO").fileUploads).toBe(true);
    // Unknown plans fall back to FREE
    expect(getLimits("BOGUS").forms).toBe(3);
  });
});