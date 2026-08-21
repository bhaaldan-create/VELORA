import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  hashPassword,
  verifyCustomerSessionToken,
  verifyPassword,
} from "@/lib/customer-auth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export async function POST(req: Request) {
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
        {
          ok: false,
          error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.",
        },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });
    if (!customer) {
      return Response.json(
        { ok: false, error: "الحساب غير موجود." },
        { status: 404 },
      );
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      customer.passwordHash,
    );
    if (!valid) {
      return Response.json(
        { ok: false, error: "كلمة المرور الحالية غير صحيحة." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[auth/password]", error);
    return Response.json(
      { ok: false, error: "تعذّر تغيير كلمة المرور." },
      { status: 500 },
    );
  }
}
