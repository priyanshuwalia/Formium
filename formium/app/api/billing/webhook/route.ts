import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookEvent } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await req.text();

  let event;
  try {
    event = await verifyWebhookEvent(payload, signature);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  const customerId =
    typeof event.data.object === "object" && event.data.object !== null
      ? (event.data.object as any).customer
      : null;

  // Map customerId -> userId via subscription/event metadata
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.user.updateMany({
        where: { email: session.customer_email ?? "" },
        data: {
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
          plan: "PRO",
          planStatus: "active",
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      // Stripes v22 types keep period dates on the line items
      const periodEnd = sub.items?.data?.[0]?.current_period_end;
      const renewAt = periodEnd ? new Date(periodEnd * 1000) : null;
      await prisma.user.updateMany({
        where: { subscriptionId: sub.id },
        data: {
          planStatus: sub.status,
          plan: sub.status === "canceled" || sub.status === "unpaid" ? "FREE" : "PRO",
          planRenewsAt: sub.status === "canceled" ? null : renewAt,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { subscriptionId: sub.id },
        data: {
          plan: "FREE",
          planStatus: "canceled",
          subscriptionId: null,
          planRenewsAt: null,
        },
      });
      break;
    }

    default:
      // Unhandled events can be ignored
      break;
  }

  return NextResponse.json({ received: true });
}