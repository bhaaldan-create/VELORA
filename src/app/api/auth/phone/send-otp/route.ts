import { z } from "zod";
import {
  createAndStoreEmailOtp,
  resolveAuthEmail,
} from "@/lib/email-otp";

/** يُعاد توجيه الواجهات القديمة — يتطلب البريد الإلكتروني */
const schema = z.object({
  email: z.string().trim().email(),
  purpose: z.enum(["register", "login"]).optional().default("register"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error:
            "أدخلي البريد الإلكتروني لإرسال رمز التحقق (التسجيل أصبح عبر البريد فقط).",
        },
        { status: 400 },
      );
    }

    const purpose = parsed.data.purpose;
    const resolved = await resolveAuthEmail({
      email: parsed.data.email,
      purpose,
    });
    if (!resolved.ok) {
      return Response.json({ ok: false, error: resolved.error }, { status: 400 });
    }

    const result = await createAndStoreEmailOtp(resolved.email, { purpose });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    return Response.json({
      ok: true,
      email: result.email,
      expiresInSec: result.expiresInSec,
      channel: "email" as const,
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
