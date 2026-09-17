import { Router } from "express";
import { checkout, portal, status, webhook } from "./billing.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
const router = Router();
router.post("/webhook", webhook);
router.get("/status", verifyToken, status);
router.post("/checkout", verifyToken, checkout);
router.post("/portal", verifyToken, portal);
export default router;
