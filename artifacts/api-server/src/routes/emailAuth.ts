import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createSession, generateJWT, type SessionData } from "../lib/auth";
import { SESSION_COOKIE, SESSION_TTL } from "../lib/auth";
import { generateOTP, sendVerificationEmail } from "../lib/email";

const router: IRouter = Router();

const crossOrigin = process.env.CROSS_ORIGIN_AUTH === "true";

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: crossOrigin ? "none" : "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.post("/auth/email/check", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));
  res.json({ exists: !!existing });
});

router.post("/auth/email/request-otp", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.execute(
    sql`INSERT INTO email_otps (email, otp_code, expires_at) VALUES (${normalizedEmail}, ${otp}, ${expiresAt})`
  );

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  try {
    await sendVerificationEmail(normalizedEmail, otp);
    console.log(`[OTP] Verification email sent to ${normalizedEmail}`);
  } catch (err) {
    console.error(`[OTP] Failed to send email to ${normalizedEmail}:`, err);
    res.status(500).json({ error: "Failed to send verification email. Please try again." });
    return;
  }

  res.json({
    success: true,
    isNewUser: !existing,
    message: "Verification code sent to your email",
  });
});

router.post("/auth/email/signup", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  const isNewUser = !user;

  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({
        email: normalizedEmail,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      })
      .returning();
    user = newUser;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    access_token: null,
    refresh_token: null,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  const token = generateJWT(sessionData.user);
  res.json({ success: true, isNewUser, token });
});

router.post("/auth/email/verify-otp", async (req: Request, res: Response) => {
  const { email, otp, firstName } = req.body;
  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOtp = String(otp).trim();

  const { rows } = await db.execute(sql`
    SELECT id FROM email_otps
    WHERE email = ${normalizedEmail}
      AND otp_code = ${normalizedOtp}
      AND is_used = FALSE
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const otpRow = (rows as any[])[0];

  if (!otpRow) {
    res.status(401).json({ error: "Invalid or expired code. Please request a new one." });
    return;
  }

  await db.execute(sql`UPDATE email_otps SET is_used = TRUE WHERE id = ${otpRow.id}`);

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  const isNewUser = !user;

  if (!user) {
    const [newUser] = await db
      .insert(usersTable)
      .values({
        email: normalizedEmail,
        firstName: firstName?.trim() || null,
        lastName: null,
        profileImageUrl: null,
      })
      .returning();
    user = newUser;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    access_token: null,
    refresh_token: null,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  const token = generateJWT(sessionData.user);
  res.json({ success: true, isNewUser, token });
});

export default router;
