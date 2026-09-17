import { Request, Response } from "express";
import * as BillingService from "./billing.service.js";
import { ApiError, asyncHandler } from "../../utils/errors.js";
import { isBillingConfigured } from "../../lib/stripe.js";

export const status = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await BillingService.getBillingStatus(req.user.id);
    res.json(data);
  } catch (err) {
    const errStatus = (err as { status?: number }).status ?? 500;
    if (errStatus !== 500) throw new ApiError((err as Error).message, errStatus);
    console.error("Billing status failed:", err);
    throw new ApiError("Failed to load billing status", 500);
  }
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  if (!isBillingConfigured()) throw new ApiError("Billing is not configured", 503);
  try {
    const url = await BillingService.startCheckout(req.user.id);
    res.json({ url });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const status = (err as { status?: number }).status ?? 500;
    if (status !== 500) throw new ApiError((err as Error).message, status);
    console.error("Stripe checkout failed:", err);
    throw new ApiError("Failed to start checkout", 500);
  }
});

export const portal = asyncHandler(async (req: Request, res: Response) => {
  if (!isBillingConfigured()) throw new ApiError("Billing is not configured", 503);
  try {
    const url = await BillingService.openBillingPortal(req.user.id);
    res.json({ url });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const status = (err as { status?: number }).status ?? 500;
    if (status !== 500) throw new ApiError((err as Error).message, status);
    console.error("Stripe portal failed:", err);
    throw new ApiError("Failed to open billing portal", 500);
  }
});

export const webhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    res.status(400).json({ error: "Missing signature" });
    return;
  }
  try {
    await BillingService.handleWebhookEvent(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    res
      .status(400)
      .json({ error: `Webhook error: ${err instanceof Error ? err.message : "Unknown error"}` });
  }
};
