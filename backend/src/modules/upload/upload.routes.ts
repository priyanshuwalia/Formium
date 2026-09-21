import { Router } from "express";
import { createUpload } from "./upload.controller.js";
import { validate, uploadSchema } from "../../utils/validation.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = Router();

const uploadLimiter = rateLimit({
  name: "upload_create",
  points: 30,
  durationSec: 60 * 60,
  keyGenerator: (req) => {
    const formId = typeof req.body?.formId === "string" ? req.body.formId : "anonymous";
    return `${formId}:${req.ip ?? "unknown"}`;
  },
});

router.post("/", uploadLimiter, validate(uploadSchema), createUpload);

export default router;
