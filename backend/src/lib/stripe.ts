import Stripe from "stripe";

export const PLAN_LIMITS = {
  FREE: {
    forms: 3,
    responsesPerMonth: 100,
    fileUploads: false,
  },
  PRO: {
    forms: Infinity,
    responsesPerMonth: Infinity,
    fileUploads: true,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export function getLimits(plan: string): {
  forms: number;
  responsesPerMonth: number;
  fileUploads: boolean;
} {
  const p = PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.FREE;
  return { ...p };
}

let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing");
  }
  return stripe;
};

export const isBillingConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "";

export async function createCheckoutSession(
  customerEmail: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { source: "formium" },
  });
  return session.url!;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return portal.url!;
}

export async function verifyWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event> {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
