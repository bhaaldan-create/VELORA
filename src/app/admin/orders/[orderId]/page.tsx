import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderDetailClient } from "@/components/admin/OrderDetailClient";
import { getStoredOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  const order = await getStoredOrder(orderId);
  if (!order) notFound();

  return (
    <AdminShell active="orders" title={order.orderId}>
      <OrderDetailClient order={order} />
    </AdminShell>
  );
}
