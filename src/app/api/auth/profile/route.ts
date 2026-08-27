import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  publicCustomer,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

const schema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  address: z.string().trim().max(500).optional(),
});

export async function PATCH(req: Request) {
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات غير صالحة." },
        { status: 400 },
      );
    }

    const data: {
      fullName?: string;
      address?: string;
    } = {};
    if (parsed.data.fullName !== undefined) data.fullName = parsed.data.fullName;
    if (parsed.data.address !== undefined) data.address = parsed.data.address;

    if (Object.keys(data).length === 0) {
      return Response.json(
        { ok: false, error: "لا توجد بيانات للتحديث." },
        { status: 400 },
      );
    }

    // رقم الهاتف لا يُغيَّر من الإعدادات إلا عبر تحقق OTP لاحقاً
    const customer = await prisma.customer.update({
      where: { id: session.customerId },
      data,
    });

    try {
      const { maybeAwardProfileCompleted } = await import("@/lib/loyalty/award");
      await maybeAwardProfileCompleted(customer.id);
    } catch (err) {
      console.error("[auth/profile] loyalty", err);
    }

    return Response.json({
      ok: true,
      customer: publicCustomer(customer),
    });
  } catch (error) {
    console.error("[auth/profile]", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ الإعدادات." },
      { status: 500 },
    );
  }
}
