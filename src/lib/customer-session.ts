import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

/** جلسة الزبون الحالية من الكوكي — أو null */
export async function getCustomerSessionId() {
  const jar = await cookies();
  const session = await verifyCustomerSessionToken(
    jar.get(CUSTOMER_COOKIE)?.value,
  );
  return session?.customerId ?? null;
}

export async function requireCustomerSessionId() {
  const customerId = await getCustomerSessionId();
  if (!customerId) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      ),
    };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });
  if (!customer) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const, customerId: customer.id };
}
