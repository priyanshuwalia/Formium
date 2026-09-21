import { Router } from "express";
import {
  forgotPassword,
  googleLogin,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  resendVerification,
  verifyEmail,
} from "./auth.controller.js"
import { validate } from "../../utils/validation.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import {
  forgotPasswordSchema,
  googleSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "../../utils/validation.js";

// Per-IP limits for credential/verification endpoints — the abuse surface.
const loginLimiter = rateLimit({ name: "auth_login", points: 10, durationSec: 15 * 60 });
const registerLimiter = rateLimit({ name: "auth_register", points: 5, durationSec: 60 * 60 });
const googleLimiter = rateLimit({ name: "auth_google", points: 10, durationSec: 15 * 60 });
const refreshLimiter = rateLimit({ name: "auth_refresh", points: 100, durationSec: 15 * 60 });
const emailLimiter = rateLimit({ name: "auth_email", points: 5, durationSec: 60 * 60 });

const router = Router();
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/google", googleLimiter, validate(googleSchema), googleLogin);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.post("/forgot-password", emailLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", emailLimiter, validate(resendVerificationSchema), resendVerification);

export default router;
