import * as client from "openid-client";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { type Request, type Response } from "express";
import { db, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "@workspace/api-zod";

export const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
export const JWT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getJwtSecret(): string {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || "caloforge-jwt-secret-change-in-prod";
}

export function generateJWT(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl },
    getJwtSecret(),
    { expiresIn: JWT_TTL_SECONDS }
  );
}

export function verifyJWT(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as any;
    if (!payload?.sub) return null;
    return {
      id: payload.sub,
      email: payload.email ?? null,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      profileImageUrl: payload.profileImageUrl ?? null,
    };
  } catch {
    return null;
  }
}

function isJWT(token: string): boolean {
  return token.startsWith("eyJ") && token.split(".").length === 3;
}

export interface SessionData {
  user: AuthUser;
  access_token: string | null;
  refresh_token?: string | null;
  expires_at?: number;
}

let oidcConfig: client.Configuration | null = null;

export async function getOidcConfig(): Promise<client.Configuration> {
  if (!oidcConfig) {
    oidcConfig = await client.discovery(
      new URL(ISSUER_URL),
      process.env.REPL_ID!,
    );
  }
  return oidcConfig;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }

  return row.sess as unknown as SessionData;
}

export async function updateSession(
  sid: string,
  data: SessionData,
): Promise<void> {
  await db
    .update(sessionsTable)
    .set({
      sess: data as unknown as Record<string, unknown>,
      expire: new Date(Date.now() + SESSION_TTL),
    })
    .where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(
  res: Response,
  sid?: string,
): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getTokenFromRequest(req: Request): { type: "jwt"; user: AuthUser } | { type: "sid"; sid: string } | null {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (isJWT(token)) {
      const user = verifyJWT(token);
      if (user) return { type: "jwt", user };
      return null;
    }
    return { type: "sid", sid: token };
  }
  const cookieVal = req.cookies?.[SESSION_COOKIE];
  if (!cookieVal) return null;
  if (isJWT(cookieVal)) {
    const user = verifyJWT(cookieVal);
    if (user) return { type: "jwt", user };
    return null;
  }
  return { type: "sid", sid: cookieVal };
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}
