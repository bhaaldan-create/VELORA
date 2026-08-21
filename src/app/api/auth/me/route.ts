import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  publicCustomer,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(CUSTOMER_COOKIE)?.value;
    const session = await verifyCustomerSessionToken(token);
    if (!session) {
      return Response.json({ ok: true, customer: null });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });
    if (!customer) {
      return Response.json({ ok: true, customer: null });
    }

    return Response.json({
      ok: true,
      customer: publicCustomer(customer),
    });
  } catch (error) {
    console.error("[auth/me]", error);
    return Response.json({ ok: true, customer: null });
  }
}
