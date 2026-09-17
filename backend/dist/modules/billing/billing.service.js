import prisma from "../../config/db.js";
import { createBillingPortalSession, createCheckoutSession, getLimits, verifyWebhookEvent, } from "../../lib/stripe.js";
const getBaseUrl = () => process.env.APP_URL || "http://localhost:5173";
export const getBillingStatus = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            plan: true,
            planStatus: true,
            planRenewsAt: true,
            _count: { select: { forms: true } },
        },
    });
    if (!user)
        throw Object.assign(new Error("User not found"), { status: 404 });
    return {
        plan: user.plan,
        planStatus: user.planStatus,
        planRenewsAt: user.planRenewsAt,
        limits: getLimits(user.plan),
        usage: { forms: user._count.forms },
    };
};
export const startCheckout = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw Object.assign(new Error("Unauthorized"), { status: 401 });
    const base = getBaseUrl();
    return createCheckoutSession(user.email, `${base}/settings?upgrade=success`, `${base}/settings?upgrade=cancelled`);
};
export const openBillingPortal = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
        throw Object.assign(new Error("No active Stripe customer"), { status: 400 });
    }
    return createBillingPortalSession(user.stripeCustomerId, `${getBaseUrl()}/settings`);
};
export const handleWebhookEvent = async (payload, signature) => {
    const event = await verifyWebhookEvent(payload, signature);
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
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
            const sub = event.data.object;
            // Stripe v22 keeps period dates on the subscription line items
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
            const sub = event.data.object;
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
            break;
    }
};
