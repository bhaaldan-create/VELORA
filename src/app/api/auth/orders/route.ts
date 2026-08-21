import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { listStoredOrders, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export async function GET() {
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

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, email: true },
    });
    if (!customer) {
      return Response.json(
        { ok: false, error: "الحساب غير موجود." },
        { status: 404 },
      );
    }

    const email = customer.email.trim().toLowerCase();
    const all = await listStoredOrders();
    const mine = all.filter((entry) => {
      const byId = entry.order.customerId === customer.id;
      const byEmail =
        (entry.order.email || "").trim().toLowerCase() === email;
      return byId || byEmail;
    });

    return Response.json({
      ok: true,
      orders: mine.map((entry) => ({
        orderId: entry.orderId,
        savedAt: entry.savedAt,
        status: entry.status,
        statusLabel: ORDER_STATUS_LABELS[entry.status],
        total: entry.order.total ?? entry.order.subtotal,
        totalLabel: formatPrice(entry.order.total ?? entry.order.subtotal),
        itemCount: entry.order.items.reduce((n, i) => n + i.quantity, 0),
        paymentMethodLabel: entry.order.paymentMethodLabel,
        shippingCarrierLabel: entry.order.shippingCarrierLabel,
      })),
    });
  } catch (error) {
    console.error("[auth/orders]", error);
    return Response.json(
      { ok: false, error: "تعذّر جلب الطلبات." },
      { status: 500 },
    );
  }
}
