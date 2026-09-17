import { Router } from "express";
import { createUpload } from "./upload.controller.js";
import { validate, uploadSchema } from "../../utils/validation.js";
const router = Router();
router.post("/", validate(uploadSchema), createUpload);
export default router;
