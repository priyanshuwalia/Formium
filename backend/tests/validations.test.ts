import { describe, it, expect } from "vitest";
import {
  registerSchema,
  createFormSchema,
  createResponseSchema,
  createFormBlockSchema,
} from "../src/utils/validation.js";
import { getLimits } from "../src/lib/stripe.js";

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
      createResponseSchema.safeParse({ formId: "f1", items: [{ blockId: "b1", value: "x" }] })
        .success,
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

  it("createFormBlock accepts logic rules and the extra block types", () => {
    const parsed = createFormBlockSchema.safeParse({
      formId: "f1",
      type: "RATING",
      label: "",
      order: 1,
      logic: [{ triggerBlockId: "b1", triggerValue: "yes" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.logic).toEqual([{ triggerBlockId: "b1", triggerValue: "yes" }]);
  });
});

describe("plan limits", () => {
  it("FREE is limited, PRO is unlimited", () => {
    expect(getLimits("FREE").forms).toBe(3);
    expect(getLimits("FREE").fileUploads).toBe(false);
    expect(getLimits("PRO").forms).toBe(Infinity);
    expect(getLimits("PRO").fileUploads).toBe(true);
    expect(getLimits("BOGUS").forms).toBe(3);
  });
});
