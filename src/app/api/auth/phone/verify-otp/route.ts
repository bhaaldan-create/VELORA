import { z } from "zod";
import { cookies } from "next/headers";
import {
  EMAIL_VERIFY_COOKIE,
  resolveAuthEmail,
  verifyEmailOtpCode,
} from "@/lib/email-otp";
import { customerCookieOptions } from "@/lib/customer-auth";

const schema = z.object({
  phone: z.string().optional(),
  email: z.string().trim().email().optional(),
  code: z.string().min(4).max(8),
});

/** توافق مع الواجهة القديمة — تحقق التسجيل عبر البريد */
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

    const resolved = await resolveAuthEmail({
      email: parsed.data.email,
      phone: parsed.data.phone,
      purpose: "register",
    });
    if (!resolved.ok) {
      return Response.json({ ok: false, error: resolved.error }, { status: 400 });
    }

    const result = await verifyEmailOtpCode(resolved.email, parsed.data.code);
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
    });
  } catch (error) {
    console.error("[auth/phone/verify-otp]", error);
    return Response.json(
      { ok: false, error: "تعذّر التحقق من الرمز." },
      { status: 500 },
    );
  }
}
