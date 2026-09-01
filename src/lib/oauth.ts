/**
 * OAuth لزبائن VELORA — Google و Apple Sign In
 * يتكامل مع جلسة الزبون الحالية (كوكي HMAC) دون next-auth.
 */

import { SignJWT, importPKCS8 } from "jose";
import { createCustomerSessionToken } from "@/lib/customer-auth";
import {
  isApplePrivateKeyAvailable,
  loadApplePrivateKeyPem,
} from "@/lib/apple-key";
import {
  OAUTH_MOBILE_RETURN_PATH,
  isMobileOAuthReturn,
  safeOAuthNext,
} from "@/lib/oauth-paths";

export {
  OAUTH_MOBILE_RETURN_PATH,
  isMobileOAuthReturn,
  safeOAuthNext,
} from "@/lib/oauth-paths";

export type OAuthProvider = "google" | "apple";

export const OAUTH_STATE_COOKIE = "velora_oauth_state";

export function getSiteOrigin() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function oauthCallbackUrl(provider: OAuthProvider) {
  return `${getSiteOrigin()}/api/auth/oauth/${provider}/callback`;
}

/** Return URL المطلوب في Apple Developer (Services ID) */
export const APPLE_WEB_OAUTH_CALLBACK_URL =
  "https://velorabeautyiq.me/api/auth/oauth/apple/callback";

export function isGoogleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
  );
}

export function isAppleOAuthConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID?.trim() &&
      process.env.APPLE_TEAM_ID?.trim() &&
      process.env.APPLE_KEY_ID?.trim() &&
      isApplePrivateKeyAvailable(),
  );
}

export function isOAuthProviderConfigured(provider: OAuthProvider) {
  return provider === "google"
    ? isGoogleOAuthConfigured()
    : isAppleOAuthConfigured();
}

function oauthSecret() {
  return (
    process.env.CUSTOMER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    "velora-oauth-dev-secret"
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSign(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toBase64Url(sig);
}

async function hmacVerify(message: string, signature: string, secret: string) {
  const expected = await hmacSign(message, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/** تذكرة قصيرة العمر لنقل الجلسة من متصفح OAuth إلى WebView */
export async function createMobileOAuthTicket(customerId: string) {
  const exp = Date.now() + 2 * 60 * 1000;
  const payload = `${customerId}.${exp}`;
  const sig = await hmacSign(payload, oauthSecret());
  return `${payload}.${sig}`;
}

export async function verifyMobileOAuthTicket(ticket: string | null | undefined) {
  if (!ticket) return null;
  const parts = ticket.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expRaw, sig] = parts;
  if (!customerId || !expRaw || !sig) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  const payload = `${customerId}.${expRaw}`;
  const ok = await hmacVerify(payload, sig, oauthSecret());
  if (!ok) return null;
  return customerId;
}

/** حالة CSRF موقّعة: next|nonce|exp|sig */
export async function createOAuthState(nextPath: string) {
  const next = safeOAuthNext(nextPath);
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${encodeURIComponent(next)}.${nonce}.${exp}`;
  const sig = await hmacSign(payload, oauthSecret());
  return `${payload}.${sig}`;
}

export async function verifyOAuthState(state: string | null | undefined) {
  if (!state) return null;
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [nextEnc, nonce, expRaw, sig] = parts;
  if (!nextEnc || !nonce || !expRaw || !sig) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  const payload = `${nextEnc}.${nonce}.${expRaw}`;
  const ok = await hmacVerify(payload, sig, oauthSecret());
  if (!ok) return null;
  return { next: safeOAuthNext(decodeURIComponent(nextEnc)), nonce };
}

export function oauthStateCookieOptions(maxAge = 600) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function buildGoogleAuthUrl(state: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthCallbackUrl("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function buildAppleAuthUrl(state: string) {
  const clientId = process.env.APPLE_CLIENT_ID!.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthCallbackUrl("apple"),
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params}`;
}

export type OAuthProfile = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
};

async function exchangeGoogleCode(code: string): Promise<OAuthProfile> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!.trim();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: oauthCallbackUrl("google"),
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(
      tokenJson.error_description || tokenJson.error || "Google token exchange failed",
    );
  }

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
  };
  if (!infoRes.ok || !info.sub || !info.email) {
    throw new Error("تعذّر قراءة بيانات حساب Google.");
  }

  const fullName =
    info.name?.trim() ||
    [info.given_name, info.family_name].filter(Boolean).join(" ").trim() ||
    info.email.split("@")[0] ||
    "VELORA Guest";

  return {
    provider: "google",
    providerUserId: info.sub,
    email: info.email.toLowerCase().trim(),
    fullName,
    emailVerified: Boolean(info.email_verified),
  };
}

async function createAppleClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID!.trim();
  const clientId = process.env.APPLE_CLIENT_ID!.trim();
  const keyId = process.env.APPLE_KEY_ID!.trim();
  const pem = loadApplePrivateKeyPem();
  if (!pem) {
    throw new Error("Apple private key غير متوفر — راجع APPLE_PRIVATE_KEY_PATH.");
  }
  const privateKey = await importPKCS8(pem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 150)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(privateKey);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    return JSON.parse(atob(padded + pad)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function exchangeAppleCode(
  code: string,
  userJson?: string | null,
): Promise<OAuthProfile> {
  const clientId = process.env.APPLE_CLIENT_ID!.trim();
  const clientSecret = await createAppleClientSecret();
  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: oauthCallbackUrl("apple"),
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = (await tokenRes.json()) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenJson.id_token) {
    throw new Error(
      tokenJson.error_description || tokenJson.error || "Apple token exchange failed",
    );
  }

  const claims = decodeJwtPayload(tokenJson.id_token);
  const sub = typeof claims?.sub === "string" ? claims.sub : "";
  let email =
    typeof claims?.email === "string" ? claims.email.toLowerCase().trim() : "";
  const emailVerified =
    claims?.email_verified === true || claims?.email_verified === "true";

  let fullName = "";
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as {
        name?: { firstName?: string; lastName?: string };
        email?: string;
      };
      fullName = [user.name?.firstName, user.name?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!email && user.email) email = user.email.toLowerCase().trim();
    } catch {
      /* ignore */
    }
  }

  if (!sub) throw new Error("تعذّر قراءة معرّف Apple.");
  if (!email) {
    // Apple قد يخفي البريد بعد أول دخول — نستخدم بريد ترحيل ثابت من sub
    email = `${sub.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}@privaterelay.appleid.com`;
  }
  if (!fullName) fullName = email.split("@")[0] || "VELORA Guest";

  return {
    provider: "apple",
    providerUserId: sub,
    email,
    fullName,
    emailVerified: Boolean(emailVerified) || email.endsWith("@privaterelay.appleid.com"),
  };
}

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  appleUserJson?: string | null,
): Promise<OAuthProfile> {
  if (provider === "google") return exchangeGoogleCode(code);
  return exchangeAppleCode(code, appleUserJson);
}

export async function createSessionCookieValue(customerId: string) {
  return createCustomerSessionToken(customerId);
}
