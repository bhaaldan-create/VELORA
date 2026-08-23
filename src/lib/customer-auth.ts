/**
 * مصادقة زبائن VELORA — Edge + Node متوافق.
 * الجلسة: كوكي httpOnly موقّع بـ HMAC-SHA256 يتضمّن معرّف الزبون.
 */

export const CUSTOMER_COOKIE = "velora_customer_session";
export const CUSTOMER_SESSION_DAYS = 30;

function getSecret() {
  const secret = process.env.CUSTOMER_SESSION_SECRET?.trim();
  const adminSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  // سر مستقل للزبائن؛ إن غاب نشتق من سر الإدارة للتطوير المحلي فقط
  return (
    secret ||
    (adminSecret ? `velora-customer:${adminSecret}` : "velora-customer-dev-secret")
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
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

const PBKDF2_ITERATIONS = 100_000;

/** تشفير كلمة المرور بـ PBKDF2 (Web Crypto) */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(bits)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const salt = fromBase64Url(parts[2] || "");
  const expected = parts[3] || "";
  if (!Number.isFinite(iterations) || !salt.length || !expected) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const actual = toBase64Url(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function createCustomerSessionToken(
  customerId: string,
  ttlMs = CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000,
) {
  // التوكن مقسوم على "." — يجب ألا يحتوي المعرّف على نقاط
  if (customerId.includes(".")) {
    throw new Error("customerId must not contain '.'");
  }
  const secret = getSecret();
  const exp = Date.now() + ttlMs;
  const payload = `v1.${customerId}.${exp}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export type CustomerSession = {
  customerId: string;
  exp: number;
};

export async function verifyCustomerSessionToken(
  token: string | undefined | null,
): Promise<CustomerSession | null> {
  if (!token) return null;
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [ver, customerId, expRaw, sig] = parts;
  if (ver !== "v1" || !customerId || !expRaw || !sig) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  const payload = `${ver}.${customerId}.${expRaw}`;
  const ok = await hmacVerify(payload, sig, secret);
  if (!ok) return null;
  return { customerId, exp };
}

export function customerCookieOptions(
  maxAgeSeconds = CUSTOMER_SESSION_DAYS * 24 * 60 * 60,
) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function publicCustomer(customer: {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  createdAt?: Date;
}) {
  return {
    id: customer.id,
    email: customer.email,
    fullName: customer.fullName,
    phone: customer.phone,
    address: customer.address,
  };
}
