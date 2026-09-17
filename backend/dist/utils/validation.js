import { z } from "zod";
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res
            .status(400)
            .json({ error: result.error.issues[0]?.message || "Invalid input" });
        return;
    }
    req.body = result.data;
    next();
};
export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(5),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const googleSchema = z.object({
    accessToken: z.string().min(1),
});
export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});
export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(5),
});
export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    bio: z.string().max(500).optional(),
    profilePicture: z.string().url().optional(),
});
export const createFormSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().max(500).optional(),
    isPublished: z.boolean().optional().default(false),
    theme: z.string().max(20).optional(),
    successText: z.string().max(200).optional(),
});
export const updateFormSchema = createFormSchema.partial();
export const blockOptionSchema = z.union([z.string(), z.number()]);
export const createFormBlockSchema = z.object({
    formId: z.string().min(1),
    type: z.enum([
        "SHORT_ANS",
        "LONG_ANS",
        "MULT_CHOICE",
        "CHECKBOXES",
        "DROPDOWN",
        "MULTI_SELE",
        "NUM",
        "EMAIL",
        "PHONE_NUM",
        "LINK",
        "FILE_UPLOAD",
        "DATE",
        "RATING",
        "DIVIDER",
        "H3",
    ]),
    label: z.string().max(300),
    required: z.boolean().optional().default(true),
    placeholder: z.string().max(300).optional(),
    options: z.array(blockOptionSchema).optional(),
    logic: z
        .array(z.object({
        triggerBlockId: z.string(),
        triggerValue: z.string(),
    }))
        .optional()
        .nullable(),
    order: z.number().int().nonnegative().optional().default(0),
});
export const updateFormBlockSchema = createFormBlockSchema
    .omit({ formId: true })
    .partial();
export const responseItemSchema = z.object({
    blockId: z.string().min(1),
    value: z.string().max(10000),
});
export const createResponseSchema = z.object({
    formId: z.string().min(1),
    items: z.array(responseItemSchema),
});
export const uploadSchema = z.object({
    formId: z.string().min(1).max(100),
    filename: z.string().min(1).max(300),
    contentType: z.string().min(1).max(150),
});
