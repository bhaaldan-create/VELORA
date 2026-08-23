import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_BASE = "https://api.thewayl.com";

export type WaylEnv = "live" | "test";

export type WaylCreateLinkInput = {
  referenceId: string;
  total: number;
  lineItems?: { label: string; amount: number }[];
  customParameter?: string;
  redirectionUrl?: string;
};

export type WaylLinkData = {
  id: string;
  referenceId: string;
  url: string;
  status: string;
  total: string;
};

export function getWaylApiKey() {
  return process.env.WAYL_API_KEY?.trim() || "";
}

export function getWaylEnv(): WaylEnv {
  const raw = process.env.WAYL_ENV?.trim().toLowerCase();
  return raw === "test" ? "test" : "live";
}

export function getWaylWebhookSecret() {
  const secret =
    process.env.WAYL_WEBHOOK_SECRET?.trim() ||
    process.env.CUSTOMER_SESSION_SECRET?.trim();
  if (!secret || secret.length < 10) {
    return "velora-wayl-wh-2026";
  }
  return secret.slice(0, 255);
}

export function getSiteOrigin() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!fromEnv) return "https://velorabeautyiq.me";
  if (fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
  return `https://${fromEnv}`;
}

export function isWaylConfigured() {
  return Boolean(getWaylApiKey());
}

/** Wayl payment links require a verified merchant store on live. */
export function isWaylStoreVerifiedFlag() {
  const flag = process.env.WAYL_STORE_VERIFIED?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

export async function isWaylCheckoutAvailable() {
  if (!isWaylConfigured()) return false;
  const verified = await verifyWaylApiKey();
  if (!verified.ok) return false;
  if (getWaylEnv() === "test") return true;
  return isWaylStoreVerifiedFlag();
}

/** User-facing Arabic messages — never expose raw API English to customers. */
export function mapWaylErrorToArabic(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("store must be verified") ||
    m.includes("verification process") ||
    m.includes("complete the verification")
  ) {
    return "الدفع الإلكتروني عبر Wayl قيد التفعيل حالياً. يمكنكِ إتمام طلبكِ بالدفع عند الاستلام، أو التواصل معنا عبر واتساب لمساعدتكِ.";
  }
  if (m.includes("wayl_api_key") || m.includes("غير مضبوط")) {
    return "بوابة الدفع الإلكتروني غير متاحة حالياً. اختاري الدفع عند الاستلام لإتمام طلبكِ.";
  }
  if (m.includes("minimum") || m.includes("1,000")) {
    return "الحد الأدنى للدفع الإلكتروني هو 1,000 د.ع.";
  }
  if (m.includes("not found") || m.includes("غير موجود")) {
    return "تعذّر العثور على الطلب. يرجى المحاولة مرة أخرى.";
  }
  return "تعذّر فتح صفحة الدفع الإلكتروني. اختاري الدفع عند الاستلام أو تواصلي معنا عبر واتساب.";
}

export function mapCheckoutErrorToArabic(message: string): string {
  if (!message.trim()) {
    return "حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.";
  }
  if (/[a-z]/i.test(message) && !message.includes("د.ع")) {
    return mapWaylErrorToArabic(message);
  }
  return message;
}

export function getWaylWebhookUrl() {
  return `${getSiteOrigin()}/api/payments/wayl/webhook`;
}

export function getWaylRedirectUrl() {
  return `${getSiteOrigin()}/checkout/success`;
}

async function waylFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = getWaylApiKey();
  if (!key) throw new Error("WAYL_API_KEY غير مضبوط.");

  const res = await fetch(`${DEFAULT_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-WAYL-AUTHENTICATION": key,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const raw = await res.text();
  let json: { message?: string; data?: T } = {};
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`استجابة Wayl غير صالحة (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(json.message || `فشل طلب Wayl (${res.status}).`);
  }

  return json.data as T;
}

export async function verifyWaylApiKey() {
  const key = getWaylApiKey();
  if (!key) return { ok: false as const, error: "المفتاح غير مضبوط." };

  const res = await fetch(`${DEFAULT_BASE}/api/v1/verify-auth-key`, {
    headers: {
      Accept: "application/json",
      "X-WAYL-AUTHENTICATION": key,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false as const, error: text || `HTTP ${res.status}` };
  }

  return { ok: true as const };
}

export async function createWaylPaymentLink(input: WaylCreateLinkInput) {
  const total = Math.round(input.total);
  if (total < 1000) {
    throw new Error("الحد الأدنى للدفع عبر Wayl هو 1,000 د.ع.");
  }

  const lineItem = (input.lineItems?.length
    ? input.lineItems.map((item) => ({
        label: item.label.slice(0, 255),
        amount: Math.round(item.amount),
        type: "increase" as const,
      }))
    : [
        {
          label: "طلب VELORA",
          amount: total,
          type: "increase" as const,
        },
      ]);

  const sum = lineItem.reduce((s, i) => s + i.amount, 0);
  if (sum !== total) {
    throw new Error("مجموع بنود Wayl لا يطابق الإجمالي.");
  }

  const data = await waylFetch<WaylLinkData>("/api/v1/links", {
    method: "POST",
    body: JSON.stringify({
      env: getWaylEnv(),
      referenceId: input.referenceId,
      total,
      currency: "IQD",
      customParameter: input.customParameter?.slice(0, 500) || "",
      lineItem,
      webhookUrl: getWaylWebhookUrl(),
      webhookSecret: getWaylWebhookSecret(),
      redirectionUrl: input.redirectionUrl || getWaylRedirectUrl(),
      linkExpiresIn: "24h",
    }),
  });

  if (!data?.url) {
    throw new Error("لم يُرجع Wayl رابط دفع.");
  }

  return data;
}

export function verifyWaylWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret = getWaylWebhookSecret(),
) {
  if (!signatureHeader?.trim()) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.trim().toLowerCase();
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isWaylPaidPayload(payload: Record<string, unknown>) {
  if (payload.safeToFulfil === true) return true;
  if (payload.safeToFulfil === false) return false;

  const paymentStatus = String(payload.paymentStatus ?? "").toLowerCase();
  if (paymentStatus === "paid") {
    return getWaylEnv() === "live";
  }

  const status = String(payload.status ?? "").toLowerCase();
  return (
    status === "complete" ||
    status === "delivered" ||
    status === "paid"
  );
}
