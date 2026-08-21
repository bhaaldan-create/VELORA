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
      title="صندوق الطلبات"
      subtitle="إدارة حالات الطلب، البحث، والوصل وواتساب من مكان واحد."
    >
      <OrdersAdmin initialOrders={orders} initialCounts={counts} />
    </AdminShell>
  );
}
