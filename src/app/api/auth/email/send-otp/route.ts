import { z } from "zod";
import { validateAuthEmail } from "@/lib/auth-email";
import {
  createAndStoreEmailOtp,
} from "@/lib/email-otp";

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
        { ok: false, error: "أدخلي بريداً إلكترونياً صالحاً." },
        { status: 400 },
      );
    }

    const validated = validateAuthEmail(parsed.data.email);
    if (!validated.ok) {
      return Response.json(
        { ok: false, error: validated.error },
        { status: 400 },
      );
    }

    const result = await createAndStoreEmailOtp(validated.email, {
      purpose: parsed.data.purpose,
    });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    return Response.json({
      ok: true,
      email: result.email,
      expiresInSec: result.expiresInSec,
      channel: result.channel,
      message: result.message,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    console.error("[auth/email/send-otp]", error);
    return Response.json(
      { ok: false, error: "تعذّر إرسال رمز التحقق." },
      { status: 500 },
    );
  }
}
