import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { normalizeIraqMobile } from "@/lib/phone";
import {
  isWhatsAppOtpConfigured,
  sendWhatsAppOtp,
} from "@/lib/whatsapp-otp";

export const PHONE_VERIFY_COOKIE = "velora_phone_verified";
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

export function hashOtpCode(phone: string, code: string) {
  return createHash("sha256")
    .update(`${otpPepper()}:${phone}:${code}`)
    .digest("hex");
}

export function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export async function shouldRevealOtpInResponse() {
  const flag = process.env.OTP_DEV_REVEAL?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "no") return false;
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return process.env.NODE_ENV !== "production" && !(await isWhatsAppOtpConfigured());
}

export async function createAndStoreOtp(phoneRaw: string) {
  const phone = normalizeIraqMobile(phoneRaw);
  if (!phone) {
    return { ok: false as const, error: "رقم الهاتف غير صالح." };
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: { phone },
  });
  if (existingCustomer) {
    return {
      ok: false as const,
      error: "هذا الرقم مسجّل مسبقاً. سجّلي الدخول بدل إنشاء حساب.",
    };
  }

  const latest = await prisma.phoneOtp.findFirst({
    where: { phone },
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
  const codeHash = hashOtpCode(phone, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.phoneOtp.create({
    data: { phone, codeHash, expiresAt },
  });

  console.info(`[otp] whatsapp phone=${phone}`);

  const wa = await sendWhatsAppOtp(phone, code);
  const reveal = await shouldRevealOtpInResponse();
  if (!wa.ok) {
    // عند حظر التسليم أو فشل الإرسال: أظهري الرمز حتى لا يتوقف التسجيل
    if (wa.deliveryBlocked || wa.missingConfig || reveal || process.env.NODE_ENV !== "production") {
      console.warn("[otp] revealing code — whatsapp unavailable", wa.error);
      return {
        ok: true as const,
        phone,
        expiresInSec: Math.floor(OTP_TTL_MS / 1000),
        channel: "dev" as const,
        devCode: code,
        message: wa.deliveryBlocked
          ? `${wa.error} مؤقتاً: استخدمي الرمز الظاهر بالأسفل لإكمال التسجيل.`
          : wa.missingConfig && reveal
            ? "وضع التطوير: واتساب غير مضبوط بعد — استخدمي الرمز الظاهر بالأسفل."
            : "تعذّر إرسال واتساب مؤقتاً — استخدمي الرمز الظاهر بالأسفل.",
      };
    }
    return {
      ok: false as const,
      error: wa.error || "تعذّر إرسال الرمز عبر واتساب.",
    };
  }

  return {
    ok: true as const,
    phone,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    channel: "whatsapp" as const,
    message: "تم إرسال رمز التحقق عبر واتساب من رقم الشركة.",
    devCode: undefined,
  };
}

export async function verifyOtpCode(phoneRaw: string, codeRaw: string) {
  const phone = normalizeIraqMobile(phoneRaw);
  const code = codeRaw.replace(/\D/g, "");
  if (!phone) {
    return { ok: false as const, error: "رقم الهاتف غير صالح." };
  }
  if (code.length !== 6) {
    return { ok: false as const, error: "أدخلي رمز التحقق المكوّن من 6 أرقام." };
  }

  const latest = await prisma.phoneOtp.findFirst({
    where: { phone, consumedAt: null },
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

  const ok = latest.codeHash === hashOtpCode(phone, code);
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

  const token = await createPhoneVerifiedToken(phone);
  return { ok: true as const, phone, token };
}

export async function createPhoneVerifiedToken(phone: string) {
  return createCustomerSessionToken(`phone:${phone}`);
}

export async function verifyPhoneVerifiedToken(
  token: string | undefined | null,
  expectedPhoneRaw: string,
) {
  const phone = normalizeIraqMobile(expectedPhoneRaw);
  if (!phone || !token) return false;

  const session = await verifyCustomerSessionToken(token);
  if (!session) return false;
  return session.customerId === `phone:${phone}`;
}
