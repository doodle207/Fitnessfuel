import { Router, type Request, type Response, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function getValidCoupons(): string[] {
  const raw = process.env.COUPON_VOUCHER || "";
  return raw.split(",").map(c => c.trim().toUpperCase()).filter(Boolean);
}

router.get("/payments/subscription", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;

  try {
    const { rows: subRows } = await db.execute(
      sql`SELECT * FROM subscriptions WHERE user_id = ${userId} LIMIT 1`
    );
    const sub = subRows[0] as any;
    const premium = sub?.is_premium && sub?.expiry_date && new Date(sub.expiry_date) > new Date();

    const today = new Date().toISOString().split("T")[0];
    const startOfWeek = (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split("T")[0];
    })();

    const { rows: usageRows } = await db.execute(
      sql`SELECT * FROM usage_tracking WHERE user_id = ${userId} LIMIT 1`
    );
    let usage = usageRows[0] as any;

    if (usage) {
      const lastDaily = usage.last_daily_reset?.toString().slice(0, 10);
      const lastWeekly = usage.last_weekly_reset?.toString().slice(0, 10);
      if (lastDaily !== today) {
        await db.execute(sql`UPDATE usage_tracking SET ai_chats_today = 0, scans_today = 0, last_daily_reset = ${today} WHERE user_id = ${userId}`);
        usage = { ...usage, ai_chats_today: 0, scans_today: 0 };
      }
      if (lastWeekly < startOfWeek) {
        await db.execute(sql`UPDATE usage_tracking SET meal_plans_this_week = 0, last_weekly_reset = ${startOfWeek} WHERE user_id = ${userId}`);
        usage = { ...usage, meal_plans_this_week: 0 };
      }
    }

    res.json({
      isPremium: !!premium,
      planName: sub?.plan_name || "free",
      expiryDate: sub?.expiry_date || null,
      couponUsed: sub?.coupon_used || null,
      usage: {
        aiChatsToday: usage?.ai_chats_today ?? 0,
        scansToday: usage?.scans_today ?? 0,
        mealPlansThisWeek: usage?.meal_plans_this_week ?? 0,
      },
      limits: { aiChatsPerDay: 2, scansPerDay: 2, mealPlansPerWeek: 1 },
    });
  } catch (err: any) {
    console.error("[payments/subscription]", err);
    res.status(500).json({ error: "Failed to load subscription" });
  }
});

router.post("/payments/redeem-coupon", async (req: Request, res: Response): Promise<void> => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = req.user.id;
  const { couponCode } = req.body;

  if (!couponCode || typeof couponCode !== "string") {
    res.status(400).json({ error: "Coupon code is required" });
    return;
  }

  const normalized = couponCode.trim().toUpperCase();
  const validCoupons = getValidCoupons();

  if (validCoupons.length === 0) {
    res.status(400).json({ error: "No vouchers are configured on this server." });
    return;
  }

  if (!validCoupons.includes(normalized)) {
    res.status(400).json({ error: "Invalid coupon code. Please check and try again." });
    return;
  }

  try {
    const { rows: userUsed } = await db.execute(
      sql`SELECT id FROM coupon_redemptions WHERE user_id = ${userId} AND coupon_code = ${normalized} LIMIT 1`
    );
    if ((userUsed as any[]).length > 0) {
      res.status(400).json({ error: "You have already used this coupon on this account." });
      return;
    }

    const { rows: globalCount } = await db.execute(
      sql`SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_code = ${normalized}`
    );
    const usageCount = (globalCount as any[])?.[0]?.count ?? 0;
    if (usageCount >= 100) {
      res.status(400).json({ error: "This coupon has reached its usage limit." });
      return;
    }

    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.execute(sql`
      INSERT INTO coupon_redemptions (user_id, coupon_code) VALUES (${userId}, ${normalized})
    `);

    await db.execute(sql`
      INSERT INTO subscriptions (user_id, is_premium, plan_name, expiry_date, payment_provider, coupon_used, updated_at)
      VALUES (${userId}, TRUE, 'coupon_7day', ${expiryDate}, 'coupon', ${normalized}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        is_premium = TRUE,
        plan_name = 'coupon_7day',
        expiry_date = ${expiryDate},
        payment_provider = 'coupon',
        coupon_used = ${normalized},
        updated_at = NOW()
    `);

    res.json({
      success: true,
      message: "Coupon activated! You now have 7 days of free Premium access.",
      expiryDate,
    });
  } catch (err: any) {
    console.error("[payments/redeem-coupon]", err);
    if (err?.code === "23505") {
      res.status(400).json({ error: "You have already used this coupon on this account." });
      return;
    }
    res.status(500).json({ error: "Failed to redeem coupon. Please try again." });
  }
});

export default router;
