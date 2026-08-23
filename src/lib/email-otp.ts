import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { normalizeIraqMobile } from "@/lib/phone";
import { getSmtpConfigIssue, isSmtpConfigured, sendOtpEmail } from "@/lib/smtp";

const REFRESH_PAGE_HINT =
  "حدّثي الصفحة (اسحبي للأسفل أو Ctrl+F5) ثم استخدمي البريد الإلكتروني.";

export const EMAIL_VERIFY_COOKIE = "velora_email_verified";
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function otpPepper() {
  return (
    process.env.CUSTOMER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    "velora-otp-dev"
  );
}

export function normalizeAuthEmail(raw: string | undefined | null) {
  const email = raw?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) return "";
  return email;
}

/** يدعم الواجهة القديمة (رقم جوال) والجديدة (بريد) */
export async function resolveAuthEmail(input: {
  email?: string | null;
  phone?: string | null;
  purpose: "register" | "login";
}) {
  const direct = normalizeAuthEmail(input.email);
  if (direct) {
    return { ok: true as const, email: direct };
  }

  const phone = input.phone ? normalizeIraqMobile(input.phone) : "";
  if (input.purpose === "login" && phone) {
    const customer = await prisma.customer.findFirst({ where: { phone } });
    if (!customer) {
      return {
        ok: false as const,
        error: "هذا الرقم غير مسجّل. أنشئي حساباً أولاً.",
      };
    }
    return { ok: true as const, email: customer.email.toLowerCase() };
  }

  if (input.purpose === "register") {
    return {
      ok: false as const,
      error: `التسجيل أصبح عبر البريد الإلكتروني. ${REFRESH_PAGE_HINT}`,
    };
  }

  return {
    ok: false as const,
    error: `أدخلي البريد الإلكتروني. ${REFRESH_PAGE_HINT}`,
  };
}

export function hashOtpCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${otpPepper()}:${email}:${code}`)
    .digest("hex");
}

export function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export async function shouldRevealOtpInResponse() {
  const flag = process.env.OTP_DEV_REVEAL?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "no") return false;
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return process.env.NODE_ENV !== "production" && !isSmtpConfigured();
}

export async function createAndStoreEmailOtp(
  emailRaw: string,
  opts?: { purpose?: "register" | "login" },
) {
  const purpose = opts?.purpose ?? "register";
  const email = normalizeAuthEmail(emailRaw);
  if (!email) {
    return { ok: false as const, error: "البريد الإلكتروني غير صالح." };
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { email },
  });

  if (purpose === "register" && existingCustomer) {
    return {
      ok: false as const,
      error: "هذا البريد مسجّل مسبقاً. سجّلي الدخول بدل إنشاء حساب.",
    };
  }

  if (purpose === "login" && !existingCustomer) {
    return {
      ok: false as const,
      error: "هذا البريد غير مسجّل. أنشئي حساباً أولاً.",
    };
  }

  const latest = await prisma.phoneOtp.findFirst({
    where: { phone: email },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    const waitSec = Math.ceil(
      (OTP_RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) /
        1000,
    );
    return {
      ok: false as const,
      error: `انتظري ${waitSec} ثانية قبل إعادة إرسال الرمز.`,
    };
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(email, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.phoneOtp.create({
    data: { phone: email, codeHash, expiresAt },
  });

  console.info(`[otp] purpose=${purpose} email=${email}`);

  const reveal = await shouldRevealOtpInResponse();
  const actionWord = purpose === "login" ? "الدخول" : "التسجيل";

  if (!isSmtpConfigured()) {
    const issue = getSmtpConfigIssue();
    if (reveal || process.env.NODE_ENV !== "production") {
      return {
        ok: true as const,
        email,
        expiresInSec: Math.floor(OTP_TTL_MS / 1000),
        channel: "dev" as const,
        devCode: code,
        message:
          issue ??
          "وضع التطوير: SMTP غير مضبوط — استخدمي الرمز الظاهر بالأسفل.",
      };
    }
    return {
      ok: false as const,
      error: issue ?? "إرسال البريد غير مفعّل حالياً.",
    };
  }

  const mailed = await sendOtpEmail(email, code, purpose);
  if (mailed.ok) {
    return {
      ok: true as const,
      email,
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
      channel: "email" as const,
      message: `تم إرسال رمز التحقق إلى ${email} — راجعي البريد (وصندوق الرسائل غير المرغوب فيها).`,
      devCode: undefined,
    };
  }

  if (reveal || process.env.NODE_ENV !== "production") {
    console.warn("[otp] email send failed, revealing code", mailed.error);
    return {
      ok: true as const,
      email,
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
      channel: "dev" as const,
      devCode: code,
      message: `${mailed.error} مؤقتاً: استخدمي الرمز الظاهر بالأسفل لإكمال ${actionWord}.`,
    };
  }

  return {
    ok: false as const,
    error: mailed.error || "تعذّر إرسال رمز التحقق عبر البريد.",
  };
}

export async function verifyEmailOtpCode(emailRaw: string, codeRaw: string) {
  const email = normalizeAuthEmail(emailRaw);
  const code = codeRaw.replace(/\D/g, "");
  if (!email) {
    return { ok: false as const, error: "البريد الإلكتروني غير صالح." };
  }
  if (code.length !== 6) {
    return { ok: false as const, error: "أدخلي رمز التحقق المكوّن من 6 أرقام." };
  }

  const latest = await prisma.phoneOtp.findFirst({
    where: { phone: email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return { ok: false as const, error: "اطلبي رمز تحقق أولاً." };
  }
  if (latest.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "انتهت صلاحية الرمز. اطلبي رمزاً جديداً." };
  }
  if (latest.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      ok: false as const,
      error: "تجاوزتِ عدد المحاولات. اطلبي رمزاً جديداً.",
    };
  }

  const ok = latest.codeHash === hashOtpCode(email, code);
  if (!ok) {
    await prisma.phoneOtp.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, error: "رمز التحقق غير صحيح." };
  }

  await prisma.phoneOtp.update({
    where: { id: latest.id },
    data: { consumedAt: new Date() },
  });

  const token = await createEmailVerifiedToken(email);
  return { ok: true as const, email, token };
}

export async function createEmailVerifiedToken(email: string) {
  return createCustomerSessionToken(`email:${email}`);
}

export async function verifyEmailVerifiedToken(
  token: string | undefined | null,
  expectedEmailRaw: string,
) {
  const email = normalizeAuthEmail(expectedEmailRaw);
  if (!email || !token) return false;

  const session = await verifyCustomerSessionToken(token);
  if (!session) return false;
  return session.customerId === `email:${email}`;
}
