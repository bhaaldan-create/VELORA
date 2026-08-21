import { z } from "zod";
import {
  getWhatsAppSetupStatus,
  sendWhatsAppTestMessage,
} from "@/lib/whatsapp-otp";
import {
  readWhatsAppRuntimeConfig,
  writeWhatsAppRuntimeConfig,
} from "@/lib/whatsapp-config";

export async function GET() {
  const status = await getWhatsAppSetupStatus();
  const config = await readWhatsAppRuntimeConfig();
  return Response.json({
    ok: true,
    ...status,
    form: {
      provider: config.provider,
      companyPhone: config.companyPhone,
      greenApiInstanceId: config.greenApiInstanceId || "",
      greenApiToken: config.greenApiToken ? "••••••••" : "",
      greenApiUrl: config.greenApiUrl || "https://api.green-api.com",
      ultramsgInstanceId: config.ultramsgInstanceId || "",
      ultramsgToken: config.ultramsgToken ? "••••••••" : "",
    },
  });
}

const saveSchema = z.object({
  provider: z.enum(["green-api", "ultramsg", "none"]),
  companyPhone: z.string().min(10).max(20),
  greenApiInstanceId: z.string().optional(),
  greenApiToken: z.string().optional(),
  greenApiUrl: z.string().optional(),
  ultramsgInstanceId: z.string().optional(),
  ultramsgToken: z.string().optional(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات غير صالحة." },
        { status: 400 },
      );
    }

    const prev = await readWhatsAppRuntimeConfig();
    const tokenGreen =
      parsed.data.greenApiToken && parsed.data.greenApiToken !== "••••••••"
        ? parsed.data.greenApiToken.trim()
        : prev.greenApiToken;
    const tokenUltra =
      parsed.data.ultramsgToken && parsed.data.ultramsgToken !== "••••••••"
        ? parsed.data.ultramsgToken.trim()
        : prev.ultramsgToken;

    const saved = await writeWhatsAppRuntimeConfig({
      provider: parsed.data.provider,
      companyPhone: parsed.data.companyPhone,
      greenApiInstanceId: parsed.data.greenApiInstanceId?.trim() || "",
      greenApiToken: tokenGreen || "",
      greenApiUrl:
        parsed.data.greenApiUrl?.trim() || "https://api.green-api.com",
      ultramsgInstanceId: parsed.data.ultramsgInstanceId?.trim() || "",
      ultramsgToken: tokenUltra || "",
    });

    return Response.json({
      ok: true,
      configured: await (await import("@/lib/whatsapp-otp")).isWhatsAppOtpConfigured(),
      companyPhone: saved.companyPhone,
    });
  } catch (error) {
    console.error("[admin/whatsapp]", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ إعدادات واتساب." },
      { status: 500 },
    );
  }
}

const testSchema = z.object({
  phone: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي رقم واتساب للمستلم." },
        { status: 400 },
      );
    }
    const result = await sendWhatsAppTestMessage(parsed.data.phone);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }
    return Response.json({
      ok: true,
      message: "تم إرسال رسالة اختبار عبر واتساب من رقم الشركة.",
      channel: result.channel,
      from: result.from,
      to: result.to,
    });
  } catch (error) {
    console.error("[admin/whatsapp test]", error);
    return Response.json(
      { ok: false, error: "تعذّر إرسال رسالة الاختبار." },
      { status: 500 },
    );
  }
}
