import type { OrderPayload } from "@/lib/order-email";
import { saveStoredOrder } from "@/lib/orders";

export const ORDER_EMAIL_TO =
  process.env.ORDER_EMAIL_TO?.trim() || "almassacompanyiraq@gmail.com";

export function getWebhookUrl() {
  return process.env.ORDER_WEBHOOK_URL?.trim() || "";
}

/** الطلبات تُحفظ دائماً في قاعدة البيانات — الإيميل اختياري */
export function isMailConfigured() {
  return true;
}

export function getMailConfigIssue(): string | null {
  return null;
}

export type SendOrderResult = {
  provider: "local" | "google-apps-script";
  emailed: boolean;
  orderId: string;
};

export async function sendOrderEmail(input: {
  order: OrderPayload;
  orderId: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendOrderResult> {
  const { order, orderId, subject, text, html } = input;

  await saveStoredOrder({
    savedAt: new Date().toISOString(),
    orderId,
    subject,
    emailedTo: ORDER_EMAIL_TO,
    order,
    text,
    status: "new",
  });

  const webhook = getWebhookUrl();
  if (!webhook) {
    return { provider: "local", emailed: false, orderId };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: ORDER_EMAIL_TO,
      subject,
      text,
      html,
      replyTo: order.email,
      orderId,
    }),
  });

  const raw = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    if (!res.ok) {
      throw new Error(
        `فشل إرسال البريد (${res.status}). تحققي من رابط ORDER_WEBHOOK_URL.`,
      );
    }
    return { provider: "google-apps-script", emailed: true, orderId };
  }

  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `فشل إرسال البريد (${res.status})`);
  }

  return { provider: "google-apps-script", emailed: true, orderId };
}

export function mapSmtpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message || "تعذّر حفظ/إرسال الطلب.";
}
