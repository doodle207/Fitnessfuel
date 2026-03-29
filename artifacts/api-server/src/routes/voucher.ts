import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const COUPON_CODE = (process.env.COUPON_CODE || "").trim().toUpperCase();

const VOUCHERS: Record<string, { durationDays: number; planName: string }> = COUPON_CODE
  ? { [COUPON_CODE]: { durationDays: 7, planName: "pro_1week" } }
  : {};

router.get("/voucher/code-hint", (req: Request, res: Response) => {
  if (!COUPON_CODE) {
    res.status(404).json({ error: "No coupon code available" });
    return;
  }
  res.json({ code: COUPON_CODE });
});

router.post("/voucher/redeem", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Please log in to redeem a voucher." });
    return;
  }

  const userId = req.user.id;
  const raw: string = (req.body?.code ?? "").trim().toUpperCase();

  if (!raw) {
    res.status(400).json({ error: "Please enter a voucher code." });
    return;
  }

  const voucher = VOUCHERS[raw];
  if (!voucher) {
    res.status(400).json({ error: "Invalid voucher code. Please check and try again." });
    return;
  }

  try {
    const { rows: already } = await db.execute(sql`
      SELECT id FROM coupon_redemptions
      WHERE user_id = ${userId} AND coupon_code = ${raw}
      LIMIT 1
    `);

    if ((already as any[]).length > 0) {
      res.status(409).json({ error: "You have already redeemed this voucher." });
      return;
    }

    const expiryDate = new Date(Date.now() + voucher.durationDays * 24 * 60 * 60 * 1000);

    await db.execute(sql`
      INSERT INTO coupon_redemptions (user_id, coupon_code)
      VALUES (${userId}, ${raw})
    `);

    await db.execute(sql`
      INSERT INTO subscriptions (user_id, is_premium, plan_name, expiry_date, payment_provider, coupon_used)
      VALUES (${userId}, TRUE, ${voucher.planName}, ${expiryDate.toISOString()}, 'voucher', ${raw})
      ON CONFLICT (user_id) DO UPDATE
        SET is_premium = TRUE,
            plan_name  = ${voucher.planName},
            expiry_date = GREATEST(
              COALESCE(subscriptions.expiry_date, NOW()),
              NOW()
            ) + INTERVAL '${sql.raw(String(voucher.durationDays))} days',
            payment_provider = 'voucher',
            coupon_used = ${raw},
            updated_at = NOW()
    `);

    const { rows } = await db.execute(sql`
      SELECT expiry_date FROM subscriptions WHERE user_id = ${userId} LIMIT 1
    `);
    const expiry = (rows as any[])[0]?.expiry_date;

    res.json({
      success: true,
      message: `🎉 Voucher applied! You have ${voucher.durationDays} days of free Pro access.`,
      expiryDate: expiry ? new Date(expiry).toISOString() : expiryDate.toISOString(),
    });
  } catch (err) {
    console.error("[voucher/redeem]", err);
    res.status(500).json({ error: "Failed to redeem voucher. Please try again." });
  }
});

export default router;
