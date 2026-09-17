import { isAxiosError } from "axios";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Please check the details you entered and try again.",
  401: "Incorrect email or password.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That already exists.",
  422: "Please check the details you entered and try again.",
  429: "Too many attempts. Please try again in a moment.",
};

const TECHNICAL_PATTERNS = [
  /status code/i,
  /network error/i,
  /timeout/i,
  /prisma/i,
  /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i,
  /[A-Za-z]:\\|\/(?:users|home|var|app)\//i,
];

const isSafeMessage = (message: string) =>
  message.length > 0 &&
  message.length < 200 &&
  !TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));

/**
 * Turns any thrown value into a short, user-facing message. Never surfaces
 * HTTP status codes, axios internals, stack traces or database errors.
 */
export const getErrorMessage = (
  error: unknown,
  fallback: string = GENERIC_MESSAGE,
): string => {
  if (!isAxiosError(error)) return fallback;

  if (!error.response) {
    return "We can't reach the server right now. Please check your connection and try again.";
  }

  const { status, data } = error.response;

  if (status >= 500) {
    return "Something went wrong on our end. Please try again.";
  }

  const apiMessage =
    data &&
    typeof data === "object" &&
    typeof (data as { error?: unknown }).error === "string"
      ? (data as { error: string }).error.trim()
      : "";

  if (isSafeMessage(apiMessage)) return apiMessage;

  return STATUS_MESSAGES[status] || fallback;
};
