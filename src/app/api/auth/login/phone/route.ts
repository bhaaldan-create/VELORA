import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  createCustomerSessionToken,
  customerCookieOptions,
  publicCustomer,
} from "@/lib/customer-auth";
import { verifyOtpCode } from "@/lib/phone-otp";
import { iraqMobileError, normalizeIraqMobile } from "@/lib/phone";

const schema = z.object({
  phone: z.string().min(1),
  code: z.string().min(4).max(8),
});

/** دخول بحساب موجود عبر واتساب OTP */
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

    const err = iraqMobileError(parsed.data.phone);
    const phone = normalizeIraqMobile(parsed.data.phone);
    if (err || !phone) {
      return Response.json(
        { ok: false, error: err || "رقم الهاتف غير صالح." },
        { status: 400 },
      );
    }

    const otp = await verifyOtpCode(parsed.data.phone, parsed.data.code);
    if (!otp.ok) {
      return Response.json({ ok: false, error: otp.error }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { phone: otp.phone },
    });
    if (!customer) {
      return Response.json(
        {
          ok: false,
          error: "هذا الرقم غير مسجّل. أنشئي حساباً أولاً.",
        },
        { status: 404 },
      );
    }

    if (!customer.phoneVerified) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phoneVerified: true },
      });
      customer.phoneVerified = true;
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
    console.error("[auth/login/phone]", error);
    return Response.json(
      { ok: false, error: "تعذّر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
