import { z } from "zod";
import { cookies } from "next/headers";
import {
  EMAIL_VERIFY_COOKIE,
  verifyEmailOtpCode,
} from "@/lib/email-otp";
import { customerCookieOptions } from "@/lib/customer-auth";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي البريد ورمز التحقق." },
        { status: 400 },
      );
    }

    const result = await verifyEmailOtpCode(parsed.data.email, parsed.data.code);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    const jar = await cookies();
    jar.set(EMAIL_VERIFY_COOKIE, result.token, {
      ...customerCookieOptions(15 * 60),
      maxAge: 15 * 60,
    });

    return Response.json({
      ok: true,
      email: result.email,
      message: "تم التحقق من البريد الإلكتروني.",
      verificationToken: result.token,
    });
  } catch (error) {
    console.error("[auth/email/verify-otp]", error);
    return Response.json(
      { ok: false, error: "تعذّر التحقق من الرمز." },
      { status: 500 },
    );
  }
}
