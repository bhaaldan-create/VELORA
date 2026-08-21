/**
 * مصادقة لوحة إدارة VELORA — Edge + Node متوافق.
 * الجلسة: كوكي httpOnly موقّع بـ HMAC-SHA256.
 */

export const ADMIN_COOKIE = "velora_admin_session";
export const ADMIN_SESSION_DAYS = 7;

function getUsername() {
  return process.env.ADMIN_USERNAME?.trim() || "";
}

function getPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const password = getPassword();
  // إن لم يُضبط السر، نشتق مفتاحاً من كلمة المرور (للتطوير المحلي)
  return secret || (password ? `velora-session:${password}` : "");
}

export function isAdminAuthConfigured() {
  return Boolean(getUsername() && getPassword() && getSecret());
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

export function timingSafeEqualString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUser = getUsername();
  const expectedPass = getPassword();
  if (!expectedUser || !expectedPass) return false;
  return (
    timingSafeEqualString(username.trim(), expectedUser) &&
    timingSafeEqualString(password, expectedPass)
  );
}

export async function createAdminSessionToken() {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET / ADMIN_PASSWORD غير مضبوط");

  const exp =
    Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `v1.${exp}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ver, expRaw, sig] = parts;
  if (ver !== "v1" || !expRaw || !sig) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const payload = `${ver}.${expRaw}`;
  return hmacVerify(payload, sig, secret);
}

export function adminCookieOptions(maxAgeSeconds = ADMIN_SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** يُستخدم في middleware فقط للتحقق السريع من الكوكي */
export async function isAdminRequestAuthorized(cookieHeader: string | null) {
  if (!isAdminAuthConfigured()) {
    // بدون كلمة مرور في البيئة — نمنع الدخول تماماً في الإنتاج،
    // وفي التطوير نسمح مع تحذير عبر صفحة الدخول.
    return false;
  }
  const match = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`),
  );
  const raw = match?.[1] ? decodeURIComponent(match[1]) : null;
  return verifyAdminSessionToken(raw);
}
