import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const MAX_REFERRALS_PER_DAY = 10;
const VALIDATION_DELAY_MS = 30 * 60 * 1000; // 30 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function ensureReferralCode(userId: string): Promise<string> {
  const { rows } = await db.execute(sql`
    SELECT referral_code FROM users WHERE id = ${userId}
  `);
  const existing = (rows as any[])[0]?.referral_code;
  if (existing) return existing;

  const { rows: rows2 } = await db.execute(sql`
    UPDATE users
    SET referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    WHERE id = ${userId}
    RETURNING referral_code
  `);
  return (rows2 as any[])[0]?.referral_code ?? "";
}

export async function processReferralValidation(referralId: number): Promise<void> {
  const { rows } = await db.execute(sql`
    SELECT r.*, ref.referral_code
    FROM referrals r
    JOIN users ref ON ref.id = r.referrer_id
    WHERE r.id = ${referralId} AND r.status = 'pending'
  `);
  const referral = (rows as any[])[0];
  if (!referral) return;

  const createdAt = new Date(referral.created_at).getTime();
  if (Date.now() - createdAt < VALIDATION_DELAY_MS) return;

  await db.execute(sql`
    UPDATE referrals SET status = 'valid', validated_at = NOW()
    WHERE id = ${referralId}
  `);

  const referrerId = referral.referrer_id;

  const { rows: countRows } = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM referrals
    WHERE referrer_id = ${referrerId} AND status = 'valid'
  `);
  const validCount = parseInt(String((countRows as any[])[0]?.cnt ?? "0"), 10);

  if (validCount > 0 && validCount % 5 === 0) {
    await grantReferralMonths(referrerId, "count_bonus", 1, referralId, `${validCount} valid referrals milestone`);
  }
}

export async function processReferralPurchaseBonus(payingUserId: string): Promise<void> {
  const { rows } = await db.execute(sql`
    SELECT * FROM referrals
    WHERE referred_user_id = ${payingUserId} AND status IN ('valid', 'pending')
    LIMIT 1
  `);
  const referral = (rows as any[])[0];
  if (!referral) return;

  const { rows: alreadyRewarded } = await db.execute(sql`
    SELECT id FROM referral_rewards
    WHERE referral_id = ${referral.id} AND type = 'purchase_bonus'
    LIMIT 1
  `);
  if ((alreadyRewarded as any[]).length > 0) return;

  if (referral.status === 'pending') {
    await db.execute(sql`
      UPDATE referrals SET status = 'valid', validated_at = NOW()
      WHERE id = ${referral.id}
    `);
  }

  await grantReferralMonths(referral.referrer_id, "purchase_bonus", 1, referral.id, "Referred user completed a payment");
}

async function grantReferralMonths(
  userId: string,
  type: string,
  months: number,
  referralId: number | null,
  note: string,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO referral_rewards (user_id, type, months_added, referral_id, note)
    VALUES (${userId}, ${type}, ${months}, ${referralId}, ${note})
  `);

  const expiryAddition = `${months * 30} days`;
  await db.execute(sql`
    INSERT INTO subscriptions (user_id, is_premium, plan_name, expiry_date, payment_provider, updated_at)
    VALUES (
      ${userId}, TRUE, 'referral_pro',
      NOW() + INTERVAL '${sql.raw(expiryAddition)}',
      'referral', NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      is_premium = TRUE,
      plan_name = 'referral_pro',
      expiry_date = GREATEST(COALESCE(subscriptions.expiry_date, NOW()), NOW()) + INTERVAL '${sql.raw(expiryAddition)}',
      payment_provider = 'referral',
      updated_at = NOW()
  `);

  console.log(`[referral] Granted ${months} month(s) of type ${type} to user ${userId}`);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/referral/info", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  try {
    const referralCode = await ensureReferralCode(userId);

    const origin = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}`
      : `http://localhost:5173`;
    const referralLink = `${origin}/?ref=${referralCode}`;

    const { rows: referralRows } = await db.execute(sql`
      SELECT r.id, r.status, r.created_at, r.validated_at,
             u.first_name, u.email
      FROM referrals r
      LEFT JOIN users u ON u.id = r.referred_user_id
      WHERE r.referrer_id = ${userId}
      ORDER BY r.created_at DESC
    `);

    const { rows: rewardRows } = await db.execute(sql`
      SELECT type, months_added, note, created_at
      FROM referral_rewards
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    const totalReferrals = (referralRows as any[]).length;
    const validReferrals = (referralRows as any[]).filter(r => r.status === "valid").length;
    const totalMonthsEarned = (rewardRows as any[]).reduce((sum: number, r: any) => sum + r.months_added, 0);
    const nextMilestone = 5 - (validReferrals % 5);

    res.json({
      referralCode,
      referralLink,
      stats: {
        totalReferrals,
        validReferrals,
        pendingReferrals: totalReferrals - validReferrals,
        totalMonthsEarned,
        nextMilestoneIn: nextMilestone === 5 ? 0 : nextMilestone,
        progressToNextMilestone: validReferrals % 5,
      },
      referrals: referralRows,
      rewards: rewardRows,
    });
  } catch (err) {
    console.error("[referral/info]", err);
    res.status(500).json({ error: "Failed to fetch referral info." });
  }
});

router.post("/referral/register", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const { refCode } = req.body;

  if (!refCode || typeof refCode !== "string") {
    res.status(400).json({ error: "Missing referral code." });
    return;
  }

  const normalizedCode = refCode.trim().toUpperCase();

  try {
    const { rows: referrerRows } = await db.execute(sql`
      SELECT id FROM users WHERE referral_code = ${normalizedCode}
    `);
    const referrer = (referrerRows as any[])[0];

    if (!referrer) {
      res.status(404).json({ error: "Invalid referral code." });
      return;
    }

    if (referrer.id === userId) {
      res.status(400).json({ error: "You cannot refer yourself." });
      return;
    }

    const { rows: alreadyReferred } = await db.execute(sql`
      SELECT id FROM referrals WHERE referred_user_id = ${userId}
    `);
    if ((alreadyReferred as any[]).length > 0) {
      res.status(409).json({ error: "You have already used a referral code." });
      return;
    }

    const signerIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || null;

    const { rows: sameIpRows } = await db.execute(sql`
      SELECT id FROM referrals
      WHERE referrer_id = ${referrer.id} AND signup_ip = ${signerIp}
      LIMIT 1
    `);
    if (signerIp && (sameIpRows as any[]).length > 0) {
      res.status(400).json({ error: "Referral cannot be completed from the same network as the referrer." });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { rows: todayRows } = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM referrals
      WHERE referrer_id = ${referrer.id} AND created_at >= ${todayStart.toISOString()}
    `);
    const todayCount = parseInt(String((todayRows as any[])[0]?.cnt ?? "0"), 10);
    if (todayCount >= MAX_REFERRALS_PER_DAY) {
      res.status(429).json({ error: "This referral link has reached today's maximum. Try again tomorrow." });
      return;
    }

    await db.execute(sql`
      INSERT INTO referrals (referrer_id, referred_user_id, status, signup_ip)
      VALUES (${referrer.id}, ${userId}, 'pending', ${signerIp})
      ON CONFLICT (referred_user_id) DO NOTHING
    `);

    res.json({ success: true, message: "Referral registered! Your referrer will be rewarded once you become an active user." });
  } catch (err) {
    console.error("[referral/register]", err);
    res.status(500).json({ error: "Failed to register referral." });
  }
});

router.post("/referral/heartbeat", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  try {
    const { rows } = await db.execute(sql`
      SELECT id, status, created_at FROM referrals
      WHERE referred_user_id = ${userId} AND status = 'pending'
      LIMIT 1
    `);
    const referral = (rows as any[])[0];

    if (!referral) {
      res.json({ ok: true, referralFound: false });
      return;
    }

    const createdAt = new Date(referral.created_at).getTime();
    const ageMs = Date.now() - createdAt;

    if (ageMs >= VALIDATION_DELAY_MS) {
      await processReferralValidation(referral.id);
      res.json({ ok: true, referralFound: true, validated: true });
    } else {
      const remainingSec = Math.ceil((VALIDATION_DELAY_MS - ageMs) / 1000);
      res.json({ ok: true, referralFound: true, validated: false, remainingSec });
    }
  } catch (err) {
    console.error("[referral/heartbeat]", err);
    res.status(500).json({ error: "Heartbeat failed." });
  }
});

router.get("/referral/leaderboard", async (req: Request, res: Response) => {
  try {
    const { rows } = await db.execute(sql`
      SELECT u.first_name, u.email,
             COUNT(r.id) FILTER (WHERE r.status = 'valid') as valid_count
      FROM users u
      JOIN referrals r ON r.referrer_id = u.id
      GROUP BY u.id, u.first_name, u.email
      HAVING COUNT(r.id) FILTER (WHERE r.status = 'valid') > 0
      ORDER BY valid_count DESC
      LIMIT 10
    `);

    res.json({
      leaderboard: (rows as any[]).map((r, i) => ({
        rank: i + 1,
        name: r.first_name ? `${r.first_name}` : (r.email ? r.email.split("@")[0] : "Anonymous"),
        validReferrals: parseInt(String(r.valid_count), 10),
      })),
    });
  } catch (err) {
    console.error("[referral/leaderboard]", err);
    res.status(500).json({ error: "Failed to load leaderboard." });
  }
});

export default router;
