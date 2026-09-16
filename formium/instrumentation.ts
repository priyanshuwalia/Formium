import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      beforeSend(event) {
        // Never send request bodies with submitted response data
        delete event.request?.data;
        return event;
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;