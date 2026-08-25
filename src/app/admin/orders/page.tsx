import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { prisma } from "@/lib/db";
import { countOrdersByStatus, listStoredOrders } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, statusGroups] = await Promise.all([
    listStoredOrders({ take: 400 }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const counts = countOrdersByStatus([]);
  counts.all = 0;
  for (const row of statusGroups) {
    const n = row._count._all;
    counts.all += n;
    const st = row.status as OrderStatus;
    if (st in counts) {
      counts[st] = n;
    }
  }

  return (
    <AdminShell
      active="orders"
      title="الطلبات"
      subtitle="مساحة عمل لإدارة الطلبات والحالات والتوصيل."
    >
      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="admin-skeleton h-10 w-48" />
            <div className="admin-skeleton h-11 w-full" />
            <div className="admin-skeleton h-28 w-full" />
            <div className="admin-skeleton h-28 w-full" />
          </div>
        }
      >
        <OrdersAdmin initialOrders={orders} initialCounts={counts} />
      </Suspense>
    </AdminShell>
  );
}
