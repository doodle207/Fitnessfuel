import { Router, type IRouter, type Request, type Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { processReferralPurchaseBonus } from "./referral";

const router: IRouter = Router();

function getRazorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID;
}

function getRazorpay() {
  const keyId = getRazorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay API keys are not configured.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

const PLANS_INR: Record<string, { amount: number; name: string; months: number }> = {
  premium: { amount: 19900, name: "Premium", months: 1 },
  pro:     { amount: 34900, name: "Pro",     months: 1 },
};

const PLANS_USD: Record<string, { amount: number; name: string; months: number }> = {
  premium: { amount: 599, name: "Premium", months: 1 },
  pro:     { amount: 999, name: "Pro",     months: 1 },
};

router.post("/payments/razorpay/create-order", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { plan, currency: reqCurrency } = req.body;
  const currency = (reqCurrency === "USD") ? "USD" : "INR";
  const planMap = currency === "USD" ? PLANS_USD : PLANS_INR;
  const planConfig = planMap[plan as string];

  if (!planConfig) {
    res.status(400).json({ error: "Invalid plan. Choose 'premium' or 'pro'." });
    return;
  }

  try {
    const razorpay = getRazorpay();
    const shortId = req.user.id.replace(/-/g, "").slice(-10);
    const receipt = `cfx_${shortId}_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount: planConfig.amount,
      currency,
      receipt,
      notes: {
        userId: req.user.id,
        plan,
        planName: planConfig.name,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      plan,
      planName: planConfig.name,
    });
  } catch (err: any) {
    console.error("[razorpay/create-order]", err);
    if (err.message?.includes("not configured")) {
      res.status(503).json({ error: "Payment gateway is not configured yet." });
    } else {
      res.status(500).json({ error: "Failed to create payment order. Please try again." });
    }
  }
});

router.post("/payments/razorpay/verify", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    res.status(400).json({ error: "Missing payment verification fields." });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(503).json({ error: "Payment gateway is not configured." });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn("[razorpay/verify] Signature mismatch for order", razorpay_order_id);
    res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    return;
  }

  const planConfig = PLANS_INR[plan as string] || PLANS_USD[plan as string];
  if (!planConfig) {
    res.status(400).json({ error: "Invalid plan." });
    return;
  }

  const userId = req.user.id;
  const expiryDate = new Date(Date.now() + planConfig.months * 30 * 24 * 60 * 60 * 1000).toISOString();
  const planName = plan === "pro" ? "razorpay_pro" : "razorpay_premium";

  try {
    await db.execute(sql`
      INSERT INTO subscriptions (user_id, is_premium, plan_name, expiry_date, payment_provider, updated_at)
      VALUES (${userId}, TRUE, ${planName}, ${expiryDate}, 'razorpay', NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        is_premium = TRUE,
        plan_name = ${planName},
        expiry_date = ${expiryDate},
        payment_provider = 'razorpay',
        updated_at = NOW()
    `);

    await db.execute(sql`
      INSERT INTO payment_history (user_id, razorpay_order_id, razorpay_payment_id, plan, amount_paise, status, created_at)
      VALUES (${userId}, ${razorpay_order_id}, ${razorpay_payment_id}, ${plan}, ${planConfig.amount}, 'success', NOW())
      ON CONFLICT DO NOTHING
    `).catch(() => {});

    console.log(`[razorpay/verify] Payment verified for user ${userId}, plan ${plan}`);

    processReferralPurchaseBonus(userId).catch(err =>
      console.error("[razorpay/verify] Referral purchase bonus error:", err),
    );

    res.json({
      success: true,
      plan,
      planName: planConfig.name,
      expiryDate,
      message: `${planConfig.name} plan activated successfully!`,
    });
  } catch (err: any) {
    console.error("[razorpay/verify] DB error:", err);
    res.status(500).json({ error: "Payment verified but failed to activate plan. Contact support." });
  }
});

export default router;
