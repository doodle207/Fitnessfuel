import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  ExchangeMobileAuthorizationCodeBody,
  ExchangeMobileAuthorizationCodeResponse,
  LogoutMobileSessionResponse,
} from "@workspace/api-zod";
import { db, usersTable, oauthStatesTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  deleteSession,
  generateJWT,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";

const OIDC_STATE_TTL_MINUTES = 10;

type PkceRow = {
  provider: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  expiresAt: Date;
};

const pkceMemory = new Map<string, PkceRow>();

function purgePkceMemory(now = new Date()) {
  for (const [state, row] of pkceMemory.entries()) {
    if (row.expiresAt < now) pkceMemory.delete(state);
  }
}

// DB-backed PKCE store (with in-memory fallback for missing DB/migrations)
async function storePkce(state: string, provider: string, codeVerifier: string, nonce: string, returnTo: string) {
  const expiresAt = new Date(Date.now() + OIDC_STATE_TTL_MINUTES * 60 * 1000);
  try {
    // Purge stale entries while we're here
    await db.delete(oauthStatesTable).where(lt(oauthStatesTable.expiresAt, new Date()));
    await db.insert(oauthStatesTable).values({ state, provider, codeVerifier, nonce, returnTo, expiresAt });
  } catch (err) {
    // If Render DB init/migrations haven't created oauth_states yet, fall back to memory.
    purgePkceMemory();
    pkceMemory.set(state, { provider, codeVerifier, nonce, returnTo, expiresAt });
    console.warn("[oauth] PKCE DB store failed; using in-memory fallback:", err);
  }
}

async function consumePkce(state: string): Promise<{ codeVerifier: string; nonce: string; returnTo: string } | null> {
  try {
    const [row] = await db.select().from(oauthStatesTable).where(eq(oauthStatesTable.state, state));
    if (!row) return null;
    await db.delete(oauthStatesTable).where(eq(oauthStatesTable.state, state));
    if (row.expiresAt < new Date()) return null;
    return { codeVerifier: row.codeVerifier, nonce: row.nonce, returnTo: row.returnTo };
  } catch (err) {
    purgePkceMemory();
    const row = pkceMemory.get(state);
    if (!row) return null;
    pkceMemory.delete(state);
    if (row.expiresAt < new Date()) return null;
    console.warn("[oauth] PKCE DB consume failed; using in-memory fallback:", err);
    return { codeVerifier: row.codeVerifier, nonce: row.nonce, returnTo: row.returnTo };
  }
}

const router: IRouter = Router();

function getAppUrl(): string | undefined {
  const raw = process.env.APP_URL;
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

function getOrigin(_req: Request): string {
  // REPLIT_DOMAINS is set in both dev and production Replit environments
  // and gives us the correct public-facing domain, bypassing proxy header issues.
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0].trim();
    return `https://${domain}`;
  }
  // Render / custom deployment
  const appUrl = getAppUrl();
  if (appUrl) return appUrl;
  // Local non-Replit fallback
  return `http://localhost:${process.env.PORT || 3000}`;
}

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


function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  const trusted = process.env.FRONTEND_URL;
  if (trusted && value.startsWith(trusted)) return value;
  return "/";
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

async function upsertGoogleUser(claims: Record<string, unknown>) {
  const email = (claims.email as string) || null;
  const googleId = `google_${claims.sub as string}`;

  if (email) {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existing) {
      await db
        .update(usersTable)
        .set({
          profileImageUrl: existing.profileImageUrl ?? ((claims.picture as string) || null),
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, existing.id));
      return { ...existing, profileImageUrl: existing.profileImageUrl ?? ((claims.picture as string) || null) };
    }
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      id: googleId,
      email,
      firstName: (claims.given_name as string) || null,
      lastName: (claims.family_name as string) || null,
      profileImageUrl: (claims.picture as string) || null,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email,
        firstName: (claims.given_name as string) || null,
        lastName: (claims.family_name as string) || null,
        profileImageUrl: (claims.picture as string) || null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

let googleOidcConfig: oidc.Configuration | null = null;

async function getGoogleOidcConfig(): Promise<oidc.Configuration | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (!googleOidcConfig) {
    googleOidcConfig = await oidc.discovery(
      new URL("https://accounts.google.com"),
      clientId,
      clientSecret,
    );
  }
  return googleOidcConfig;
}

router.get("/auth/user", (req: Request, res: Response) => {
  const user = req.isAuthenticated() ? req.user : null;
  const token = user ? generateJWT(user) : undefined;
  res.json({ user: user ?? null, token });
});

// Frontend compatibility endpoint: returns the user directly.
// `useAuth` in the app expects `/api/auth/me` to 401 when logged out.
router.get("/auth/me", (req: Request, res: Response) => {
  const user = req.isAuthenticated() ? req.user : null;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(user);
});

router.get("/auth/providers", (_req: Request, res: Response) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    replit: true,
  });
});

router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  // Store PKCE data in DB — shared across all server processes
  await storePkce(state, "replit", codeVerifier, nonce, returnTo);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  res.redirect(redirectTo.href);
});

router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const stateParam = req.query.state as string | undefined;
  const pkce = stateParam ? await consumePkce(stateParam) : null;

  console.log("[callback] state lookup:", { stateParam: !!stateParam, pkceFound: !!pkce, callbackUrl });

  if (!pkce) {
    console.log("[callback] FAIL: no PKCE state found for state param");
    res.redirect("/?error=auth_session_expired");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: pkce.codeVerifier,
      expectedNonce: pkce.nonce,
      expectedState: stateParam,
      idTokenExpected: true,
    });
  } catch (err) {
    console.error("[callback] FAIL: authorizationCodeGrant error:", err);
    res.redirect("/?error=auth_failed");
    return;
  }

  const returnTo = pkce.returnTo;

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/?error=auth_failed");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  console.log("[callback] SUCCESS: session created, redirecting to", returnTo);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

const GOOGLE_CALLBACK_URL = getAppUrl()
  ? `${getAppUrl()}/api/auth/google/callback`
  : "https://caloforge.com/api/auth/google/callback";

router.get("/auth/google/login", async (req: Request, res: Response) => {
  const config = await getGoogleOidcConfig();
  if (!config) {
    res.redirect("/?error=google_not_configured");
    return;
  }

  const callbackUrl = GOOGLE_CALLBACK_URL;
  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  // Store PKCE data in DB — shared across all server processes
  await storePkce(state, "google", codeVerifier, nonce, returnTo);

  res.redirect(redirectTo.href);
});

router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const config = await getGoogleOidcConfig();
  if (!config) {
    res.redirect("/");
    return;
  }

  const callbackUrl = GOOGLE_CALLBACK_URL;
  const stateParam = req.query.state as string | undefined;
  const pkce = stateParam ? await consumePkce(stateParam) : null;

  console.log("[google/callback] state lookup:", { stateParam: !!stateParam, pkceFound: !!pkce });

  if (!pkce) {
    res.redirect("/?error=auth_session_expired");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  try {
    const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: pkce.codeVerifier,
      expectedNonce: pkce.nonce,
      expectedState: stateParam,
      idTokenExpected: true,
    });

    const claims = tokens.claims();
    if (!claims) {
      res.redirect("/?error=google_auth_failed");
      return;
    }

    const dbUser = await upsertGoogleUser(
      claims as unknown as Record<string, unknown>,
    );

    const now = Math.floor(Date.now() / 1000);
    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
    };

    const sid = await createSession(sessionData);
    console.log("[google/callback] SUCCESS: session created");
    setSessionCookie(res, sid);
    res.redirect(pkce.returnTo);
  } catch (err) {
    const anyErr: any = err;
    const msg = String(anyErr?.message || "");
    const code = String(anyErr?.code || anyErr?.error || "");
    const responseBody = anyErr?.response?.body;
    const responseText =
      typeof responseBody === "string"
        ? responseBody
        : responseBody && typeof responseBody === "object"
          ? JSON.stringify(responseBody)
          : "";
    const combined = `${code} ${msg} ${responseText}`.toLowerCase();

    const reason =
      combined.includes("redirect_uri") ? "redirect_uri_mismatch"
      : combined.includes("unauthorized_client") ? "unauthorized_client"
      : combined.includes("invalid_client") ? "invalid_client"
      : combined.includes("invalid_grant") ? "invalid_grant"
      : combined.includes("access_denied") ? "access_denied"
      : combined.includes("invalid_request") ? "invalid_request"
      : combined.includes("pkce") || combined.includes("state") ? "pkce_failed"
      : "unknown";

    // Log full error details server-side; don't leak internals to browser.
    console.error("Google auth error:", err);
    res.redirect(`/?error=google_auth_failed&reason=${encodeURIComponent(reason)}`);
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const origin = getOrigin(req);

  const sid = getSessionId(req);
  await clearSession(res, sid);

  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: origin,
  });

  res.redirect(endSessionUrl.href);
});

router.post(
  "/mobile-auth/token-exchange",
  async (req: Request, res: Response) => {
    const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required parameters" });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("iss", ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: "No claims in ID token" });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json(ExchangeMobileAuthorizationCodeResponse.parse({ token: sid }));
    } catch (err) {
      console.error("Mobile token exchange error:", err);
      res.status(500).json({ error: "Token exchange failed" });
    }
  },
);

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
});

export default router;
