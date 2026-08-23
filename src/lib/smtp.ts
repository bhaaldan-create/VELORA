import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SmtpSendResult =
  | { ok: true }
  | { ok: false; error: string };

let cachedTransport: Transporter | null = null;

function smtpHost() {
  return process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
}

function smtpPort() {
  const raw = process.env.SMTP_PORT?.trim();
  const n = raw ? Number(raw) : 587;
  return Number.isFinite(n) ? n : 587;
}

const DEFAULT_SMTP_USER = "orders@velorabeautyiq.me";

/** Gmail App Password = 16 حرفاً (أحياناً مع مسافات — نزيلها) */
export function normalizeSmtpPass(raw: string | undefined | null) {
  return (raw ?? "").trim().replaceAll(" ", "").replaceAll('"', "").replaceAll("'", "");
}

export function getSmtpPass() {
  return normalizeSmtpPass(process.env.SMTP_PASS);
}

export function getSmtpUser() {
  return process.env.SMTP_USER?.trim() || DEFAULT_SMTP_USER;
}

export function getMailFromAddress() {
  return (
    process.env.MAIL_FROM?.trim() || getSmtpUser() || DEFAULT_SMTP_USER
  );
}

/** اسم المرسل الظاهر للزبائن — ثابت لضمان عدم ظهور اسم حساب Google الشخصي */
export const VELORA_MAIL_FROM_NAME = "VELORA Beauty";

export function getMailFromName() {
  return VELORA_MAIL_FROM_NAME;
}

export function isSmtpConfigured() {
  return Boolean(getSmtpPass());
}

function looksLikeGmailAppPassword(pass: string) {
  return pass.length === 16 && /^[a-zA-Z0-9]+$/.test(pass);
}

export function getSmtpConfigIssue(): string | null {
  const pass = getSmtpPass();
  if (!pass) {
    return [
      "SMTP_PASS غير مضبوط على Vercel.",
      "فعّلي التحقّق بخطوتين على orders@velorabeautyiq.me،",
      "ثم أنشئي App Password من myaccount.google.com/apppasswords",
      "وضعيه في Vercel → SMTP_PASS (Production).",
    ].join(" ");
  }
  if (!looksLikeGmailAppPassword(pass)) {
    return [
      "SMTP_PASS ليست App Password صحيحة من Google.",
      "كلمة مرور الحساب العادية لا تعمل مع SMTP.",
      "فعّلي التحقّق بخطوتين على orders@velorabeautyiq.me،",
      "أنشئي App Password (16 حرفاً)،",
      "واستبدلي SMTP_PASS على Vercel ثم Redeploy.",
    ].join(" ");
  }
  return null;
}

function getTransport() {
  if (!isSmtpConfigured()) return null;
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: smtpHost(),
      port: smtpPort(),
      secure: smtpPort() === 465,
      auth: {
        user: getSmtpUser(),
        pass: getSmtpPass(),
      },
    });
  }
  return cachedTransport;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<SmtpSendResult> {
  const issue = getSmtpConfigIssue();
  if (issue) {
    return { ok: false, error: issue };
  }

  const fromAddress = getMailFromAddress();
  if (!fromAddress) {
    return { ok: false, error: "MAIL_FROM أو SMTP_USER غير مضبوط." };
  }

  const transport = getTransport();
  if (!transport) {
    return { ok: false, error: "تعذّر تهيئة SMTP." };
  }

  const fromName = getMailFromName();

  try {
    await transport.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo ?? fromAddress,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[smtp] send failed", message);
    return { ok: false, error: mapSmtpSendError(message) };
  }
}

function mapSmtpSendError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("authentication")) {
    return [
      "فشل تسجيل الدخول إلى SMTP.",
      "Google لا يقبل كلمة مرور الحساب — تحتاجين App Password (16 حرفاً).",
      "فعّلي التحقّق بخطوتين على orders@velorabeautyiq.me،",
      "أنشئي App Password، وضعيها في SMTP_PASS على Vercel.",
    ].join(" ");
  }
  if (lower.includes("recipient address rejected") || lower.includes("mailbox")) {
    return "عنوان البريد المستلم مرفوض.";
  }
  return message || "تعذّر إرسال البريد.";
}

export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: "register" | "login",
): Promise<SmtpSendResult> {
  const action =
    purpose === "login" ? "تسجيل الدخول إلى حسابكِ" : "إنشاء حسابكِ";
  const subject = `فريق VELORA Beauty — رمز التحقق (${code})`;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://velorabeautyiq.me";

  const text = [
    "VELORA Beauty",
    "فريق VELORA Beauty",
    "",
    `مرحباً،`,
    "",
    `رمز التحقق لـ${action} على موقع VELORA:`,
    "",
    code,
    "",
    "صالح لمدة 5 دقائق. لا تشاركي هذا الرمز مع أحد.",
    "",
    "إذا لم تطلبي هذا الرمز، تجاهلي هذه الرسالة.",
    "",
    "مع تحيات فريق VELORA Beauty 🤍",
    siteUrl,
  ].join("\n");

  const html = `
    <div dir="rtl" style="font-family: Georgia, 'Times New Roman', serif; color: #3d2b4a; max-width: 440px; margin: 0 auto;">
      <div style="border-bottom: 1px solid #e8dfe6; padding-bottom: 16px; margin-bottom: 20px;">
        <p style="letter-spacing: 0.18em; font-size: 11px; color: #8b6f8e; margin: 0 0 6px; text-transform: uppercase;">VELORA Beauty</p>
        <p style="font-size: 15px; font-weight: 600; margin: 0; color: #3d2b4a;">فريق VELORA Beauty</p>
      </div>
      <p style="margin: 0 0 12px; line-height: 1.7; font-size: 15px;">مرحباً،</p>
      <p style="margin: 0 0 20px; line-height: 1.7; font-size: 15px;">
        رمز التحقق لـ<strong>${action}</strong> على موقع VELORA:
      </p>
      <div style="background: #f8f4f1; border: 1px solid #e8dfe6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p dir="ltr" style="font-size: 32px; letter-spacing: 0.4em; font-weight: 700; margin: 0; color: #3d2b4a;">${code}</p>
      </div>
      <p style="font-size: 13px; color: #6b5b6e; line-height: 1.6; margin: 0 0 24px;">
        صالح لمدة 5 دقائق. لا تشاركي الرمز مع أحد.<br/>
        إذا لم تطلبي هذا الرمز، تجاهلي هذه الرسالة.
      </p>
      <p style="font-size: 14px; color: #3d2b4a; margin: 0 0 4px;">مع تحيات فريق VELORA Beauty 🤍</p>
      <p style="font-size: 12px; margin: 0;"><a href="${siteUrl}" style="color: #8b6f8e;">velorabeautyiq.me</a></p>
    </div>
  `;

  return sendTransactionalEmail({ to: email, subject, text, html });
}
