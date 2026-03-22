import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const LIMITS = { aiChat: 2, scan: 2, mealPlan: 1 };

async function ensureUsageRow(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const startOfWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  })();

  await db.execute(sql`
    INSERT INTO usage_tracking (user_id, ai_chats_today, scans_today, meal_plans_this_week, last_daily_reset, last_weekly_reset)
    VALUES (${userId}, 0, 0, 0, ${today}, ${startOfWeek})
    ON CONFLICT (user_id) DO NOTHING
  `);

  const { rows } = await db.execute(sql`SELECT * FROM usage_tracking WHERE user_id = ${userId} LIMIT 1`);
  let usage = rows[0] as any;

  const lastDaily = usage.last_daily_reset?.toString().slice(0, 10);
  const lastWeekly = usage.last_weekly_reset?.toString().slice(0, 10);
  const needsDailyReset = lastDaily !== today;
  const needsWeeklyReset = lastWeekly < startOfWeek;

  if (needsDailyReset || needsWeeklyReset) {
    if (needsDailyReset) {
      await db.execute(sql`UPDATE usage_tracking SET ai_chats_today = 0, scans_today = 0, last_daily_reset = ${today} WHERE user_id = ${userId}`);
    }
    if (needsWeeklyReset) {
      await db.execute(sql`UPDATE usage_tracking SET meal_plans_this_week = 0, last_weekly_reset = ${startOfWeek} WHERE user_id = ${userId}`);
    }
    const r2 = await db.execute(sql`SELECT * FROM usage_tracking WHERE user_id = ${userId} LIMIT 1`);
    usage = r2.rows[0] as any;
  }

  return usage;
}

async function isUserPremium(userId: string): Promise<boolean> {
  const { rows } = await db.execute(
    sql`SELECT is_premium, expiry_date FROM subscriptions WHERE user_id = ${userId} LIMIT 1`
  );
  const sub = rows[0] as any;
  if (!sub?.is_premium) return false;
  if (!sub.expiry_date) return false;
  return new Date(sub.expiry_date) > new Date();
}

export function checkLimit(type: "aiChat" | "scan" | "mealPlan") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return next();
    const userId = req.user.id;

    try {
      if (await isUserPremium(userId)) return next();

      const usage = await ensureUsageRow(userId);
      const limit = LIMITS[type];
      const current =
        type === "aiChat" ? (usage.ai_chats_today ?? 0) :
        type === "scan" ? (usage.scans_today ?? 0) :
        (usage.meal_plans_this_week ?? 0);

      if (current >= limit) {
        const periodText = type === "mealPlan" ? "this week" : "today";
        const featureName = type === "aiChat" ? "AI chats" : type === "scan" ? "food scans" : "meal plans";
        return res.status(429).json({
          limitReached: true,
          type,
          used: current,
          limit,
          message: `You've used all ${limit} free ${featureName} ${periodText}. Upgrade to Premium for unlimited access.`,
        });
      }

      if (type === "aiChat") await db.execute(sql`UPDATE usage_tracking SET ai_chats_today = ai_chats_today + 1 WHERE user_id = ${userId}`);
      else if (type === "scan") await db.execute(sql`UPDATE usage_tracking SET scans_today = scans_today + 1 WHERE user_id = ${userId}`);
      else if (type === "mealPlan") await db.execute(sql`UPDATE usage_tracking SET meal_plans_this_week = meal_plans_this_week + 1 WHERE user_id = ${userId}`);
    } catch (err) {
      console.error("[usageLimit] error:", err);
    }

    next();
  };
}
