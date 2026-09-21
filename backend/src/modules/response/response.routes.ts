import { Router } from "express";
import { createResponseHandler, getResponsesHandler, getResponseHandler, exportResponsesHandler } from "./response.controller.js";
import { validate, createResponseSchema } from "../../utils/validation.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = Router();

// Anonymous submissions are the main scripted-abuse target — cap per IP/form.
const submitLimiter = rateLimit({
  name: "response_submit",
  points: 20,
  durationSec: 60,
  keyGenerator: (req) => {
    const formId = typeof req.body?.formId === "string" ? req.body.formId : "anonymous";
    return `${formId}:${req.ip ?? "unknown"}`;
  },
});

router.post("/", submitLimiter, validate(createResponseSchema), createResponseHandler);
router.get("/export", verifyToken, exportResponsesHandler);
router.get("/detail/:id", verifyToken, getResponseHandler);
router.get("/:formId", verifyToken, getResponsesHandler);

export default router;
