import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** Expected, safe-to-surface failures. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};

/** Central error handler — never leaks internals or raw statuses. */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message || "Invalid input" });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
};
