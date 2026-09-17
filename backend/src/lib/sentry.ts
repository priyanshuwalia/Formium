import * as Sentry from "@sentry/node";
import type { Express } from "express";

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
};

/** Must be registered after all routes, before the app's own error handler. */
export const attachSentryErrorHandler = (app: Express) => {
  if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
};

export { Sentry };
