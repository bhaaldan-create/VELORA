import { NextResponse } from "next/server";
import { readWhatsAppRuntimeConfig } from "@/lib/whatsapp-config";

type CacheEntry = {
  at: number;
  payload: Record<string, unknown>;
};

const globalForQr = globalThis as unknown as {
  veloraWaQrCache?: CacheEntry;
};

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false as const, status: res.status, data: null, text: "" };
  }
  try {
    return {
      ok: true as const,
      status: res.status,
      data: JSON.parse(text) as Record<string, unknown>,
      text,
    };
  } catch {
    return { ok: false as const, status: res.status, data: null, text };
  }
}

export async function GET() {
  const config = await readWhatsAppRuntimeConfig();
  const id =
    process.env.GREEN_API_INSTANCE_ID?.trim() ||
    config.greenApiInstanceId?.trim() ||
    "";
  const token =
    process.env.GREEN_API_TOKEN?.trim() || config.greenApiToken?.trim() || "";
  const apiUrl = (
    process.env.GREEN_API_URL?.trim() ||
    config.greenApiUrl?.trim() ||
    "https://api.green-api.com"
  ).replace(/\/$/, "");

  if (!id || !token) {
    return NextResponse.json(
      { ok: false, error: "مفاتيح Green API غير محفوظة." },
      { status: 400 },
    );
  }

  const cached = globalForQr.veloraWaQrCache;
  if (cached && Date.now() - cached.at < 15_000) {
    return NextResponse.json(cached.payload);
  }

  try {
    const stateParsed = await readJsonSafe(
      await fetch(`${apiUrl}/waInstance${id}/getStateInstance/${token}`, {
        cache: "no-store",
      }),
    );
    const stateInstance =
      (stateParsed.data?.stateInstance as string | undefined) || "unknown";

    if (stateInstance === "authorized") {
      const payload = {
        ok: true,
        stateInstance: "authorized",
        qrBase64: null,
        message: "الرقم مربوط وجاهز.",
      };
      globalForQr.veloraWaQrCache = { at: Date.now(), payload };
      return NextResponse.json(payload);
    }

    if (
      stateInstance === "yellowCard" ||
      stateInstance === "suspended" ||
      stateInstance === "blocked"
    ) {
      const payload = {
        ok: true,
        stateInstance,
        qrBase64: null,
        message:
          stateInstance === "blocked"
            ? "الرقم محظور من واتساب — راجعي دعم واتساب من الهاتف."
            : "قيد مؤقت (بطاقة صفراء): واتساب لا يسلّم الرسائل. من هاتف الشركة: الإعدادات → المساعدة → تواصل معنا واطلبي رفع القيد، ثم أعدي تشغيل الجلسة من هنا.",
      };
      globalForQr.veloraWaQrCache = { at: Date.now(), payload };
      return NextResponse.json(payload);
    }

    // انتظر قليلاً لتقليل 429 من Green API
    await new Promise((r) => setTimeout(r, 800));

    const qrParsed = await readJsonSafe(
      await fetch(`${apiUrl}/waInstance${id}/qr/${token}`, {
        cache: "no-store",
      }),
    );

    if (qrParsed.status === 429) {
      const payload = {
        ok: true,
        stateInstance,
        qrBase64: cached?.payload?.qrBase64 ?? null,
        message:
          "Green API يطلب التريّث (كثرة الطلبات). انتظري 20 ثانية ثم حدّثي.",
      };
      return NextResponse.json(payload);
    }

    if (!qrParsed.ok || !qrParsed.data) {
      return NextResponse.json({
        ok: true,
        stateInstance,
        qrBase64: null,
        message:
          "الـ instance ما زال يقلع أو الرد فارغ. انتظري 30 ثانية واضغطي تحديث.",
      });
    }

    const qrType = String(qrParsed.data.type || "");
    const qrMessage = String(qrParsed.data.message || "");
    const isImage = qrType === "qrCode" && qrMessage.length > 100;

    const payload = {
      ok: true,
      stateInstance,
      qrType,
      qrBase64: isImage ? qrMessage : null,
      message: isImage
        ? "امسحي الرمز فوراً — يتغيّر خلال ثوانٍ"
        : qrMessage ||
          "لا يوجد QR الآن. من لوحة Green API اضغطي Get QR أيضاً.",
    };

    if (isImage) {
      globalForQr.veloraWaQrCache = { at: Date.now(), payload };
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin/whatsapp/qr]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? `تعذّر جلب الرمز: ${error.message}`
            : "تعذّر جلب رمز الربط.",
      },
      { status: 500 },
    );
  }
}
