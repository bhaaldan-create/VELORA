import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  createCustomerSessionToken,
  customerCookieOptions,
  publicCustomer,
} from "@/lib/customer-auth";
import { verifyEmailOtpCode } from "@/lib/email-otp";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().min(4).max(8),
});

/** دخول بحساب موجود عبر رمز تحقق يُرسل إلى البريد */
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

    const otp = await verifyEmailOtpCode(parsed.data.email, parsed.data.code);
    if (!otp.ok) {
      return Response.json({ ok: false, error: otp.error }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: otp.email },
    });
    if (!customer) {
      return Response.json(
        {
          ok: false,
          error: "هذا البريد غير مسجّل. أنشئي حساباً أولاً.",
        },
        { status: 404 },
      );
    }

    const jar = await cookies();
    jar.set(
      CUSTOMER_COOKIE,
      await createCustomerSessionToken(customer.id),
      customerCookieOptions(),
    );

    return Response.json({
      ok: true,
      customer: publicCustomer(customer),
      message: "تم تسجيل الدخول بنجاح.",
    });
  } catch (error) {
    console.error("[auth/login/email]", error);
    return Response.json(
      { ok: false, error: "تعذّر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
