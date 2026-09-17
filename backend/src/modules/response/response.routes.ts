import { Router } from "express";
import { createResponseHandler, getResponsesHandler, getResponseHandler, exportResponsesHandler } from "./response.controller.js";
import { validate, createResponseSchema } from "../../utils/validation.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.post("/", validate(createResponseSchema), createResponseHandler);
router.get("/export", verifyToken, exportResponsesHandler);
router.get("/detail/:id", getResponseHandler);
router.get("/:formId", getResponsesHandler);

export default router;
