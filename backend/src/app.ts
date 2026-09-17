import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes.js";
import formRoutes from "./modules/form/form.routes.js";
import formBlockRoutes from "./modules/formBlock/formBlock.routes.js";
import responseRoutes from "./modules/response/response.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import { errorHandler, notFoundHandler } from "./utils/errors.js";
import { attachSentryErrorHandler, initSentry } from "./lib/sentry.js";

dotenv.config();
initSentry();

const app = express();

// Behind the Vercel proxy — needed for Secure cookies to be set correctly
app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "https://form-buddy-v68o.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      ...(process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
        : []),
    ],
    credentials: true,
  }),
);

// Stripe needs the raw body to verify webhook signatures, so mount it before
// the JSON body parser.
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Welcome To Formium API" });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/form-blocks", formBlockRoutes);
app.use("/api/response", responseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFoundHandler);
attachSentryErrorHandler(app);
app.use(errorHandler);

export default app;
