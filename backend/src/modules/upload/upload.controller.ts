import { Request, Response } from "express";
import prisma from "../../config/db.js";
import { createUploadUrl, isUploadConfigured } from "../../lib/r2.js";
import { getLimits } from "../../lib/stripe.js";
import { ApiError, asyncHandler } from "../../utils/errors.js";

/**
 * Response uploads are public (anonymous respondents), but gated by the
 * form owner's plan.
 */
export const createUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!isUploadConfigured()) throw new ApiError("File uploads are not configured", 503);

  const { formId, filename, contentType } = req.body;

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { User: { select: { plan: true } } },
  });

  if (!form) throw new ApiError("Form not found", 404);
  if (!getLimits(form.User?.plan || "FREE").fileUploads) {
    throw new ApiError("File uploads require the Pro plan", 403);
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^\.+/, "");
  const key = `uploads/${form.userId}/${formId}/${Date.now()}-${safeName}`;

  try {
    const uploadUrl = await createUploadUrl(key, contentType);
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("Failed to create upload URL:", err);
    throw new ApiError("Failed to create upload URL", 500);
  }
});
