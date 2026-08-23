import { prisma } from "@/lib/db";
import { listStoredOrders } from "@/lib/orders";

export type AdminCustomerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

export async function listAdminCustomers(): Promise<AdminCustomerRow[]> {
  const [customers, orders] = await Promise.all([
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    listStoredOrders(),
  ]);

  return customers.map((c) => {
    const phone = c.phone ?? "";
    const phoneDigits = phone.replace(/\D/g, "");
    const email = c.email.toLowerCase();
    const related = orders.filter((o) => {
      const op = o.order.phone.replace(/\D/g, "");
      if (!phoneDigits) return o.order.email.toLowerCase() === email;
      return (
        o.order.email.toLowerCase() === email ||
        op.endsWith(phoneDigits.slice(-10)) ||
        phoneDigits.endsWith(op.slice(-10))
      );
    });
    const totalSpent = related.reduce((sum, o) => {
      return (
        sum +
        (o.order.total ?? o.order.subtotal + (o.order.deliveryFee ?? 0))
      );
    }, 0);
    const last = related[0]?.savedAt ?? null;
    return {
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone,
      address: c.address,
      createdAt: c.createdAt.toISOString(),
      ordersCount: related.length,
      totalSpent,
      lastOrderAt: last,
    };
  });
}
