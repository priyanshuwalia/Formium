import { Router } from "express";
import { analyzeForm } from "./ai.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = Router();

router.get("/analyze", verifyToken, analyzeForm);

export default router;
