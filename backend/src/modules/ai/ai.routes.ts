import { Router } from "express";
import { analyzeForm, getAiQuota } from "./ai.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/analyze", verifyToken, analyzeForm);
router.get("/quota", verifyToken, getAiQuota);

export default router;
