/**
 * إرسال واتساب من رقم الشركة عبر Green API / Ultramsg / Cloud API / Webhook.
 * رقم الشركة الافتراضي: 07830000492
 */

import { normalizeIraqMobile } from "@/lib/phone";
import { readWhatsAppRuntimeConfig } from "@/lib/whatsapp-config";

export type WhatsAppSendResult =
  | {
      ok: true;
      channel: "green-api" | "ultramsg" | "cloud-api" | "webhook";
      from: string;
    }
  | {
      ok: false;
      error: string;
      missingConfig?: boolean;
      /** واتساب يرفض التسليم (yellowCard / blocked / غير مربوط) */
      deliveryBlocked?: boolean;
      stateInstance?: string;
    };

export async function getGreenApiInstanceState(): Promise<{
  stateInstance: string;
  ok: boolean;
}> {
  const { idInstance, apiToken, apiUrl } = await resolveGreenConfig();
  if (!idInstance || !apiToken) {
    return { ok: false, stateInstance: "notConfigured" };
  }
  try {
    const res = await fetch(
      `${apiUrl}/waInstance${idInstance}/getStateInstance/${apiToken}`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as { stateInstance?: string };
    return {
      ok: res.ok,
      stateInstance: data.stateInstance || "unknown",
    };
  } catch {
    return { ok: false, stateInstance: "unreachable" };
  }
}

function isSendBlockedState(state: string) {
  const s = state.toLowerCase();
  return (
    s === "yellowcard" ||
    s === "suspended" ||
    s === "blocked" ||
    s === "notauthorized" ||
    s === "starting"
  );
}

function blockedStateMessage(state: string) {
  const s = state.toLowerCase();
  if (s === "yellowcard" || s === "suspended") {
    return "واتساب وضع قيداً مؤقتاً على رقم الشركة (بطاقة صفراء). الرسائل لا تُسلَّم حتى يُرفع القيد من دعم واتساب على هاتف 07830000492.";
  }
  if (s === "blocked") {
    return "رقم واتساب الشركة محظور حالياً. راجعي دعم واتساب من الهاتف.";
  }
  if (s === "notauthorized") {
    return "واتساب غير مربوط. افتحي /admin/whatsapp-link وامسحي رمز QR من هاتف الشركة.";
  }
  if (s === "starting") {
    return "جلسة واتساب قيد التشغيل — أعيدي المحاولة بعد دقيقة.";
  }
  return `حالة واتساب غير جاهزة للإرسال (${state}).`;
}

async function resolveCompanyPhone() {
  const file = await readWhatsAppRuntimeConfig();
  return (
    normalizeIraqMobile(
      process.env.WHATSAPP_COMPANY_PHONE?.trim() || file.companyPhone,
    ) || "9647830000492"
  );
}

async function resolveGreenConfig() {
  const file = await readWhatsAppRuntimeConfig();
  const idInstance =
    process.env.GREEN_API_INSTANCE_ID?.trim() ||
    file.greenApiInstanceId?.trim() ||
    "";
  const apiToken =
    process.env.GREEN_API_TOKEN?.trim() || file.greenApiToken?.trim() || "";
  const apiUrl = (
    process.env.GREEN_API_URL?.trim() ||
    file.greenApiUrl?.trim() ||
    "https://api.green-api.com"
  ).replace(/\/$/, "");
  return { idInstance, apiToken, apiUrl };
}

async function resolveUltramsgConfig() {
  const file = await readWhatsAppRuntimeConfig();
  const instanceId =
    process.env.ULTRAMSG_INSTANCE_ID?.trim() ||
    file.ultramsgInstanceId?.trim() ||
    "";
  const token =
    process.env.ULTRAMSG_TOKEN?.trim() || file.ultramsgToken?.trim() || "";
  return { instanceId, token };
}

function getCloudConfig() {
  const token = process.env.WHATSAPP_TOKEN?.trim() || "";
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    process.env.WHATSAPP_PHONE_ID?.trim() ||
    "";
  const template =
    process.env.WHATSAPP_OTP_TEMPLATE?.trim() || "velora_otp";
  const language = process.env.WHATSAPP_OTP_LANGUAGE?.trim() || "ar";
  const graphVersion =
    process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0";
  return { token, phoneNumberId, template, language, graphVersion };
}

export async function isWhatsAppOtpConfigured() {
  const green = await resolveGreenConfig();
  if (green.idInstance && green.apiToken) return true;
  const ultra = await resolveUltramsgConfig();
  if (ultra.instanceId && ultra.token) return true;
  const cloud = getCloudConfig();
  if (cloud.token && cloud.phoneNumberId) return true;
  return Boolean(process.env.WHATSAPP_OTP_WEBHOOK_URL?.trim());
}

export function buildOtpWhatsAppMessage(code: string) {
  return [
    `*VELORA*`,
    ``,
    `رمز التحقق الخاص بكِ: *${code}*`,
    `صالح لمدة 5 دقائق.`,
    ``,
    `لا تشاركيه مع أحد.`,
  ].join("\n");
}

async function sendViaGreenApi(
  phone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const { idInstance, apiToken, apiUrl } = await resolveGreenConfig();
  const from = await resolveCompanyPhone();
  if (!idInstance || !apiToken) {
    return { ok: false, error: "Green API غير مضبوط.", missingConfig: true };
  }

  const state = await getGreenApiInstanceState();
  if (isSendBlockedState(state.stateInstance)) {
    console.error("[whatsapp] green-api blocked state", state.stateInstance);
    return {
      ok: false,
      deliveryBlocked: true,
      stateInstance: state.stateInstance,
      error: blockedStateMessage(state.stateInstance),
    };
  }

  const url = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: `${phone}@c.us`,
      message,
    }),
  });

  const raw = await res.text();
  let data: { idMessage?: string; message?: string; error?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    /* ignore */
  }

  if (!res.ok || data.error || !data.idMessage) {
    console.error("[whatsapp] green-api failed", raw);
    return {
      ok: false,
      error:
        data.error ||
        data.message ||
        `فشل إرسال واتساب عبر Green API (${res.status})`,
    };
  }

  // أحياناً يعيد Green API نجاحاً ظاهرياً رغم yellowCard — نتحقق مجدداً
  const stateAfter = await getGreenApiInstanceState();
  if (isSendBlockedState(stateAfter.stateInstance)) {
    console.error(
      "[whatsapp] green-api accepted message but state is blocked",
      stateAfter.stateInstance,
    );
    return {
      ok: false,
      deliveryBlocked: true,
      stateInstance: stateAfter.stateInstance,
      error: blockedStateMessage(stateAfter.stateInstance),
    };
  }

  return { ok: true, channel: "green-api", from };
}

async function sendViaUltramsg(
  phone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const { instanceId, token } = await resolveUltramsgConfig();
  const from = await resolveCompanyPhone();
  if (!instanceId || !token) {
    return { ok: false, error: "Ultramsg غير مضبوط.", missingConfig: true };
  }

  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
  const body = new URLSearchParams({
    token,
    to: phone,
    body: message,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const raw = await res.text();
  let data: { sent?: string; error?: string; message?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    /* ignore */
  }

  if (!res.ok || data.error || data.sent === "false") {
    console.error("[whatsapp] ultramsg failed", raw);
    return {
      ok: false,
      error: data.error || data.message || "فشل إرسال واتساب عبر Ultramsg.",
    };
  }

  return { ok: true, channel: "ultramsg", from };
}

async function sendViaCloudApi(
  phone: string,
  code: string,
): Promise<WhatsAppSendResult> {
  const { token, phoneNumberId, template, language, graphVersion } =
    getCloudConfig();
  const from = await resolveCompanyPhone();
  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: "إعدادات Cloud API غير مكتملة.",
      missingConfig: true,
    };
  }

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

  async function post(components: unknown[]) {
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components,
        },
      }),
    });
  }

  let res = await post([
    { type: "body", parameters: [{ type: "text", text: code }] },
    {
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: code }],
    },
  ]);
  let raw = await res.text();

  if (!res.ok) {
    res = await post([
      { type: "body", parameters: [{ type: "text", text: code }] },
    ]);
    raw = await res.text();
  }

  if (!res.ok) {
    console.error("[whatsapp] cloud api failed", raw);
    let msg = "فشل إرسال واتساب عبر Cloud API.";
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: msg };
  }

  return { ok: true, channel: "cloud-api", from };
}

async function sendViaWebhook(
  phone: string,
  code: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const webhook = process.env.WHATSAPP_OTP_WEBHOOK_URL?.trim();
  const from = await resolveCompanyPhone();
  if (!webhook) {
    return { ok: false, error: "لا يوجد webhook.", missingConfig: true };
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: "whatsapp",
      from,
      phone,
      code,
      message,
    }),
  });

  const raw = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    if (res.ok) return { ok: true, channel: "webhook", from };
  }

  if (!res.ok || data.ok === false) {
    return {
      ok: false,
      error: data.error || `فشل webhook واتساب (${res.status})`,
    };
  }

  return { ok: true, channel: "webhook", from };
}

export async function sendWhatsAppOtp(
  phone: string,
  code: string,
): Promise<WhatsAppSendResult> {
  const message = buildOtpWhatsAppMessage(code);
  const green = await resolveGreenConfig();
  const ultra = await resolveUltramsgConfig();
  const cloud = getCloudConfig();

  try {
    if (green.idInstance && green.apiToken) {
      return await sendViaGreenApi(phone, message);
    }
    if (ultra.instanceId && ultra.token) {
      return await sendViaUltramsg(phone, message);
    }
    if (cloud.token && cloud.phoneNumberId) {
      return await sendViaCloudApi(phone, code);
    }
    if (process.env.WHATSAPP_OTP_WEBHOOK_URL?.trim()) {
      return await sendViaWebhook(phone, code, message);
    }

    return {
      ok: false,
      missingConfig: true,
      error:
        "واتساب غير مربوط. افتحي /admin/whatsapp واربطي رقم الشركة 07830000492 عبر Green API.",
    };
  } catch (error) {
    console.error("[whatsapp-otp]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "تعذّر إرسال واتساب.",
    };
  }
}

export async function getWhatsAppSetupStatus() {
  const file = await readWhatsAppRuntimeConfig();
  const green = await resolveGreenConfig();
  const ultra = await resolveUltramsgConfig();
  const cloud = getCloudConfig();
  const companyPhone = await resolveCompanyPhone();
  const state = green.idInstance && green.apiToken
    ? await getGreenApiInstanceState()
    : { ok: false, stateInstance: "notConfigured" };
  return {
    companyPhone,
    companyPhoneLocal: file.companyPhone || "07830000492",
    configured: await isWhatsAppOtpConfigured(),
    stateInstance: state.stateInstance,
    deliveryReady: state.stateInstance === "authorized",
    warning: isSendBlockedState(state.stateInstance)
      ? blockedStateMessage(state.stateInstance)
      : null,
    config: {
      provider: file.provider,
      hasGreenToken: Boolean(green.apiToken),
      greenApiInstanceId: green.idInstance
        ? `${green.idInstance.slice(0, 4)}…`
        : "",
      hasUltramsgToken: Boolean(ultra.token),
    },
    providers: {
      greenApi: Boolean(green.idInstance && green.apiToken),
      ultramsg: Boolean(ultra.instanceId && ultra.token),
      cloudApi: Boolean(cloud.token && cloud.phoneNumberId),
      webhook: Boolean(process.env.WHATSAPP_OTP_WEBHOOK_URL?.trim()),
    },
  };
}

/** اختبار إرسال من رقم الشركة إلى رقم تجريبي */
export async function sendWhatsAppTestMessage(toPhoneRaw: string) {
  const phone = normalizeIraqMobile(toPhoneRaw);
  if (!phone) {
    return { ok: false as const, error: "رقم المستلم غير صالح." };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const result = await sendWhatsAppOtp(phone, code);
  if (!result.ok) return { ok: false as const, error: result.error };
  return {
    ok: true as const,
    channel: result.channel,
    from: result.from,
    to: phone,
    sampleCode: code,
  };
}
