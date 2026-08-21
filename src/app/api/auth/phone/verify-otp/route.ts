import { z } from "zod";
import { cookies } from "next/headers";
import {
  PHONE_VERIFY_COOKIE,
  verifyOtpCode,
} from "@/lib/phone-otp";
import { customerCookieOptions } from "@/lib/customer-auth";

const schema = z.object({
  phone: z.string().min(1),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي الرقم ورمز التحقق." },
        { status: 400 },
      );
    }

    const result = await verifyOtpCode(parsed.data.phone, parsed.data.code);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    const jar = await cookies();
    // صلاحية قصيرة: 15 دقيقة لإكمال التسجيل
    jar.set(PHONE_VERIFY_COOKIE, result.token, {
      ...customerCookieOptions(15 * 60),
      maxAge: 15 * 60,
    });

    return Response.json({
      ok: true,
      phone: result.phone,
      message: "تم التحقق من رقم الهاتف.",
    });
  } catch (error) {
    console.error("[auth/phone/verify-otp]", error);
    return Response.json(
      { ok: false, error: "تعذّر التحقق من الرمز." },
      { status: 500 },
    );
  }
}
