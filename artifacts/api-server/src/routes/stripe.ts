import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

const PLAN_PRICES: Record<string, { usdCents: number; name: string }> = {
  premium: { usdCents: 599, name: "Premium" },
  pro: { usdCents: 999, name: "Pro" },
};

function getAppBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return process.env.APP_URL || "http://localhost:5173";
}

router.post("/api/payments/stripe/create-session", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY." });
    return;
  }

  const { plan } = req.body as { plan: string };
  const planInfo = PLAN_PRICES[plan];
  if (!planInfo) { res.status(400).json({ error: "Invalid plan." }); return; }

  try {
    const baseUrl = getAppBaseUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `CaloForgeX ${planInfo.name}`,
              description: `${planInfo.name} Plan — 30 days unlimited access`,
            },
            unit_amount: planInfo.usdCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/pricing?stripe_success=1&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${baseUrl}/pricing?stripe_cancel=1`,
      metadata: { userId: req.user.id, plan },
      customer_email: req.user.email || undefined,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("[Stripe] create-session error:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to create Stripe session." });
  }
});

router.post("/api/payments/stripe/verify-session", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }

  const stripe = getStripe();
  if (!stripe) { res.status(503).json({ error: "Stripe not configured." }); return; }

  const { sessionId, plan } = req.body as { sessionId: string; plan: string };
  if (!sessionId) { res.status(400).json({ error: "Session ID required." }); return; }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed." });
      return;
    }

    if (session.metadata?.userId && session.metadata.userId !== req.user.id) {
      res.status(403).json({ error: "Session does not belong to this user." });
      return;
    }

    const planName = PLAN_PRICES[plan]?.name || "Premium";
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.execute(sql`
      UPDATE users
      SET subscription_plan = ${plan}, subscription_expires_at = ${expiresAt}
      WHERE id = ${req.user.id}
    `);

    await db.execute(sql`
      INSERT INTO payment_history (user_id, provider, provider_order_id, provider_payment_id, amount_cents, currency, plan, status)
      VALUES (${req.user.id}, 'stripe', ${sessionId}, ${session.payment_intent as string || sessionId}, ${session.amount_total || 0}, 'USD', ${plan}, 'success')
      ON CONFLICT DO NOTHING
    `);

    res.json({
      success: true,
      planName,
      message: `${planName} plan activated for 30 days!`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error("[Stripe] verify-session error:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to verify Stripe session." });
  }
});

export default router;
