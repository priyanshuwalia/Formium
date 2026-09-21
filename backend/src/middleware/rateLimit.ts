import { NextFunction, Request, Response } from "express";
import { RateLimiterPrisma } from "rate-limiter-flexible";
import prisma from "../config/db.js";

// Postgres-backed fixed-window rate limiting. Rows live in the shared
// RateLimiterFlexible table so Windows/instances agree on a count without
// leaking state per serverless warm instance.
const instances = new Map<string, RateLimiterPrisma>();

const getLimiter = (name: string, points: number, durationSec: number) => {
  let inst = instances.get(name);
  if (!inst) {
    inst = new RateLimiterPrisma({
      storeClient: prisma,
      tableName: "RateLimiterFlexible",
      keyPrefix: name,
      points,
      duration: durationSec,
    });
    instances.set(name, inst);
  }
  return inst;
};

export type RateLimitOptions = {
  name: string;
  points: number;
  durationSec: number;
  keyGenerator?: (req: Request) => string;
};

/** Express middleware. Rejects with 429 once `points` are consumed. */
export const rateLimit =
  ({ name, points, durationSec, keyGenerator }: RateLimitOptions) =>
  (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip ?? "unknown";

    getLimiter(name, points, durationSec)
      .consume(key)
      .then((_rate) => next())
      .catch(() => {
        res.status(429).json({ error: "Too many requests. Please try again later." });
      });
  };