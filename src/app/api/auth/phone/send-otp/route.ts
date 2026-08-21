import { z } from "zod";
import { createAndStoreOtp } from "@/lib/phone-otp";
import { iraqMobileError, normalizeIraqMobile } from "@/lib/phone";

const schema = z.object({
  phone: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي رقم الهاتف." },
        { status: 400 },
      );
    }

    const err = iraqMobileError(parsed.data.phone);
    if (err || !normalizeIraqMobile(parsed.data.phone)) {
      return Response.json(
        { ok: false, error: err || "رقم الهاتف غير صالح." },
        { status: 400 },
      );
    }

    const result = await createAndStoreOtp(parsed.data.phone);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    return Response.json({
      ok: true,
      phone: result.phone,
      expiresInSec: result.expiresInSec,
      channel: result.channel,
      message: result.message,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    console.error("[auth/phone/send-otp]", error);
    return Response.json(
      { ok: false, error: "تعذّر إرسال رمز التحقق." },
      { status: 500 },
    );
  }
}
