import { Router } from "express";
import { googleLogin, login, register } from "./auth.controller.js"

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

export default router;
