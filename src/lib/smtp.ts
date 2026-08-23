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
  const subject = `VELORA Beauty — رمز التحقق ${code}`;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://velorabeautyiq.me";

  const text = [
    "VELORA Beauty",
    "BEAUTY REVEALED",
    "",
    "مرحباً،",
    "",
    `رمز التحقق لـ${action} على موقع VELORA:`,
    "",
    code,
    "",
    "صالح لمدة 5 دقائق. لا تشاركي هذا الرمز مع أحد.",
    "",
    "إذا لم تطلبي هذا الرمز، تجاهلي هذه الرسالة.",
    "",
    "مع تحيات فريق VELORA Beauty",
    siteUrl,
  ].join("\n");

  const html = buildVeloraOtpEmailHtml({ code, action, siteUrl });

  return sendTransactionalEmail({ to: email, subject, text, html });
}

function buildVeloraOtpEmailHtml(input: {
  code: string;
  action: string;
  siteUrl: string;
}) {
  const { code, action, siteUrl } = input;
  const digits = code.split("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VELORA Beauty</title>
</head>
<body style="margin:0;padding:0;background:#f6f1ee;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e8dfe6;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(180deg,#3d2640 0%,#5a3a5f 100%);padding:28px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:34px;letter-spacing:0.28em;color:#f8f4f1;font-weight:500;">VELORA</p>
              <p style="margin:0;font-size:10px;letter-spacing:0.42em;color:#dcc9d8;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Beauty Revealed</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 12px;">
              <p style="margin:0 0 10px;font-size:16px;line-height:1.8;color:#3d2640;">مرحباً،</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#5c4a63;">
                رمز التحقق لـ<strong style="color:#3d2640;">${action}</strong> على موقع VELORA:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 24px;">
                <tr>
                  ${digits
                    .map(
                      (digit) =>
                        `<td style="width:44px;height:52px;background:#f8f4f1;border:1px solid #e8dfe6;border-radius:10px;text-align:center;font-size:28px;font-weight:700;color:#3d2640;font-family:Helvetica,Arial,sans-serif;">${digit}</td><td style="width:8px;"></td>`,
                    )
                    .join("")}
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#8b6f8e;text-align:center;">
                صالح لمدة <strong>5 دقائق</strong>. لا تشاركي الرمز مع أحد.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#8b6f8e;text-align:center;">
                إذا لم تطلبي هذا الرمز، تجاهلي هذه الرسالة.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <a href="${siteUrl}" style="display:inline-block;padding:12px 28px;background:#3d2640;color:#f8f4f1;text-decoration:none;border-radius:999px;font-size:13px;letter-spacing:0.08em;font-family:Helvetica,Arial,sans-serif;">زيارة velorabeautyiq.me</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px 24px;border-top:1px solid #f0e8ee;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#8b6f8e;">مع تحيات فريق VELORA Beauty</p>
              <p style="margin:0;font-size:11px;color:#b7a5b3;font-family:Helvetica,Arial,sans-serif;">orders@velorabeautyiq.me</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
