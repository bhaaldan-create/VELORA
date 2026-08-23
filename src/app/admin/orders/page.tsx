import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { countOrdersByStatus, listStoredOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listStoredOrders();
  const counts = countOrdersByStatus(orders);

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
