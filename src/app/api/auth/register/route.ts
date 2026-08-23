import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  createCustomerSessionToken,
  customerCookieOptions,
  CUSTOMER_COOKIE,
  hashPassword,
  publicCustomer,
} from "@/lib/customer-auth";
import { normalizeIraqMobile } from "@/lib/phone";
import { validateAuthEmail } from "@/lib/auth-email";
import {
  EMAIL_VERIFY_COOKIE,
  verifyEmailVerifiedToken,
} from "@/lib/email-otp";

const schema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جداً."),
  email: z.string().trim().email("البريد غير صالح."),
  phone: z.string().trim().min(10, "رقم الهاتف غير صالح."),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل."),
  address: z.string().trim().max(500).optional(),
  emailVerificationToken: z.string().trim().min(10).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "بيانات غير مكتملة.";
      return Response.json({ ok: false, error: msg }, { status: 400 });
    }

    const phone = normalizeIraqMobile(parsed.data.phone);
    if (!phone) {
      return Response.json(
        {
          ok: false,
          error: "استخدمي رقم جوال عراقي بصيغة 07XXXXXXXXX.",
        },
        { status: 400 },
      );
    }

    const validatedEmail = validateAuthEmail(parsed.data.email);
    if (!validatedEmail.ok) {
      return Response.json(
        { ok: false, error: validatedEmail.error },
        { status: 400 },
      );
    }

    const email = validatedEmail.email;
    const jar = await cookies();
    const cookieToken = jar.get(EMAIL_VERIFY_COOKIE)?.value;
    const bodyToken = parsed.data.emailVerificationToken?.trim();
    const verifiedByBody = bodyToken
      ? await verifyEmailVerifiedToken(bodyToken, email)
      : false;
    const verifiedByCookie = !verifiedByBody
      ? await verifyEmailVerifiedToken(cookieToken, email)
      : false;
    if (!verifiedByBody && !verifiedByCookie) {
      return Response.json(
        {
          ok: false,
          error: "يجب التحقق من البريد الإلكتروني برمز OTP قبل إنشاء الحساب.",
        },
        { status: 403 },
      );
    }

    const existingEmail = await prisma.customer.findUnique({ where: { email } });
    if (existingEmail) {
      return Response.json(
        { ok: false, error: "هذا البريد مسجّل مسبقاً. جرّبي تسجيل الدخول." },
        { status: 409 },
      );
    }

    const existingPhone = await prisma.customer.findUnique({ where: { phone } });
    if (existingPhone) {
      return Response.json(
        {
          ok: false,
          error: "هذا الرقم مسجّل مسبقاً. سجّلي الدخول بدل إنشاء حساب.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const customer = await prisma.customer.create({
      data: {
        email,
        passwordHash,
        fullName: parsed.data.fullName,
        phone,
        phoneVerified: false,
        address: parsed.data.address?.trim() || "",
      },
    });

    const token = await createCustomerSessionToken(customer.id);
    jar.set(CUSTOMER_COOKIE, token, customerCookieOptions());
    jar.set(EMAIL_VERIFY_COOKIE, "", {
      ...customerCookieOptions(0),
      maxAge: 0,
    });

    return Response.json({
      ok: true,
      customer: publicCustomer(customer),
    });
  } catch (error) {
    console.error("[auth/register]", error);
    return Response.json(
      { ok: false, error: "تعذّر إنشاء الحساب. حاولي لاحقاً." },
      { status: 500 },
    );
  }
}
