import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  createCustomerSessionToken,
  customerCookieOptions,
  CUSTOMER_COOKIE,
  publicCustomer,
  verifyPassword,
} from "@/lib/customer-auth";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي البريد وكلمة المرور." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return Response.json(
        { ok: false, error: "البريد أو كلمة المرور غير صحيحة." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(
      parsed.data.password,
      customer.passwordHash,
    );
    if (!valid) {
      return Response.json(
        { ok: false, error: "البريد أو كلمة المرور غير صحيحة." },
        { status: 401 },
      );
    }

    const token = await createCustomerSessionToken(customer.id);
    const jar = await cookies();
    jar.set(CUSTOMER_COOKIE, token, customerCookieOptions());

    return Response.json({
      ok: true,
      customer: publicCustomer(customer),
    });
  } catch (error) {
    console.error("[auth/login]", error);
    return Response.json(
      { ok: false, error: "تعذّر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
