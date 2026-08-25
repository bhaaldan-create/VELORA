/**
 * مصادقة لوحة إدارة VELORA — Edge + Node متوافق.
 * الجلسة: كوكي httpOnly موقّع بـ HMAC-SHA256.
 *
 * v1.{exp}.{sig}           — جلسة الجذر (ADMIN_USERNAME من البيئة)
 * v2.{exp}.{subject}.{sig} — جلسة موظف (subject = employeeId) أو root
 */

export const ADMIN_COOKIE = "velora_admin_session";
export const ADMIN_SESSION_DAYS = 7;
/** يعتبر الموظف «نشطاً على الموقع» خلال هذه المدة من lastSeenAt */
export const ADMIN_ONLINE_MS = 5 * 60 * 1000;

export type AdminSessionSubject = "root" | string;

export type AdminSession = {
  ok: true;
  subject: AdminSessionSubject;
  exp: number;
  /** Employee.role or "root" — present on v3 tokens */
  role?: string;
};

function getUsername() {
  return process.env.ADMIN_USERNAME?.trim() || "";
}

function getPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const password = getPassword();
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

function getAccessCode() {
  return (
    process.env.ADMIN_ACCESS_CODE?.trim().toUpperCase() || "AA2B12"
  );
}

export function verifyAdminAccessCode(code: string) {
  const expected = getAccessCode();
  if (!expected) return false;
  return timingSafeEqualString(code.trim().toUpperCase(), expected);
}

export async function createAdminSessionToken(
  subject: AdminSessionSubject = "root",
  role = "root",
) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET / ADMIN_PASSWORD غير مضبوط");
  }

  const exp = Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000;
  const safeSubject = encodeURIComponent(subject || "root");
  const safeRole = encodeURIComponent(role || "other");
  // v3 includes role for Edge RBAC without a DB lookup
  const payload = `v3.${exp}.${safeSubject}.${safeRole}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function parseAdminSessionToken(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length === 3 && parts[0] === "v1") {
    const [ver, expRaw, sig] = parts;
    if (!ver || !expRaw || !sig) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    const payload = `${ver}.${expRaw}`;
    if (!(await hmacVerify(payload, sig, secret))) return null;
    return { ok: true, subject: "root", exp, role: "root" };
  }

  if (parts.length === 4 && parts[0] === "v2") {
    const [ver, expRaw, subjectRaw, sig] = parts;
    if (!ver || !expRaw || !subjectRaw || !sig) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    const payload = `${ver}.${expRaw}.${subjectRaw}`;
    if (!(await hmacVerify(payload, sig, secret))) return null;
    let subject: AdminSessionSubject = "root";
    try {
      subject = decodeURIComponent(subjectRaw) || "root";
    } catch {
      subject = subjectRaw;
    }
    return {
      ok: true,
      subject,
      exp,
      role: subject === "root" ? "root" : undefined,
    };
  }

  if (parts.length === 5 && parts[0] === "v3") {
    const [ver, expRaw, subjectRaw, roleRaw, sig] = parts;
    if (!ver || !expRaw || !subjectRaw || !roleRaw || !sig) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    const payload = `${ver}.${expRaw}.${subjectRaw}.${roleRaw}`;
    if (!(await hmacVerify(payload, sig, secret))) return null;
    let subject: AdminSessionSubject = "root";
    let role = "other";
    try {
      subject = decodeURIComponent(subjectRaw) || "root";
      role = decodeURIComponent(roleRaw) || "other";
    } catch {
      subject = subjectRaw;
      role = roleRaw;
    }
    if (subject === "root") role = "root";
    return { ok: true, subject, exp, role };
  }

  return null;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
) {
  const session = await parseAdminSessionToken(token);
  return Boolean(session?.ok);
}

export function adminCookieOptions(
  maxAgeSeconds = ADMIN_SESSION_DAYS * 24 * 60 * 60,
) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function isEmployeeOnline(lastSeenAt: Date | string | null | undefined) {
  if (!lastSeenAt) return false;
  const t =
    typeof lastSeenAt === "string"
      ? new Date(lastSeenAt).getTime()
      : lastSeenAt.getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= ADMIN_ONLINE_MS;
}

/** يُستخدم في middleware فقط للتحقق السريع من الكوكي */
export async function isAdminRequestAuthorized(cookieHeader: string | null) {
  if (!isAdminAuthConfigured()) {
    return false;
  }
  const match = cookieHeader?.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`),
  );
  const raw = match?.[1] ? decodeURIComponent(match[1]) : null;
  return verifyAdminSessionToken(raw);
}
