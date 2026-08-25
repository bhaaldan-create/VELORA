import { AdminShell } from "@/components/admin/AdminShell";
import { WaylStatusCard } from "@/components/admin/WaylStatusCard";
import {
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import { CreditCard } from "@/components/admin/ui/icons";
import { listStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const orders = await listStoredOrders({ take: 400 });
  const paid = orders.filter((o) => o.order.paymentStatus === "paid");
  const pending = orders.filter(
    (o) =>
      o.order.paymentStatus === "pending" ||
      o.order.paymentStatus === "unpaid",
  );
  const paidTotal = paid.reduce(
    (s, o) =>
      s + (o.order.total ?? o.order.subtotal + (o.order.deliveryFee ?? 0)),
    0,
  );

  const byMethod = new Map<string, number>();
  for (const o of orders) {
    const key = o.order.paymentMethodLabel || "غير محدد";
    byMethod.set(key, (byMethod.get(key) || 0) + 1);
  }

  return (
    <AdminShell active="payments" title="المدفوعات">
      <div className="space-y-6">
        <PageHeader
          title="المدفوعات"
          description="ملخص طرق الدفع وحالات التحصيل من الطلبات الفعلية."
        />

        <WaylStatusCard />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            label="مدفوع"
            value={paidTotal}
            format="iqd"
            icon={CreditCard}
            tone="success"
          />
          <StatCard
            label="طلبات مدفوعة"
            value={paid.length}
            format="number"
            tone="success"
          />
          <StatCard
            label="بانتظار التحقق"
            value={pending.length}
            format="number"
            tone="warning"
          />
        </div>

        <Surface>
          <h2 className="mb-4 text-[13px] font-semibold">توزيع طرق الدفع</h2>
          <ul className="space-y-2">
            {[...byMethod.entries()].map(([label, count]) => (
              <li
                key={label}
                className="flex justify-between gap-3 border-b border-[var(--admin-border)] py-2 text-[13px] last:border-0"
              >
                <span>{label}</span>
                <span className="admin-num font-medium">{count}</span>
              </li>
            ))}
            {byMethod.size === 0 ? (
              <li className="py-6 text-center text-[13px] text-[var(--admin-text-muted)]">
                لا بيانات دفع بعد
              </li>
            ) : null}
          </ul>
        </Surface>

        {pending.length > 0 ? (
          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold">بانتظار الدفع</h2>
            <ul className="divide-y divide-[var(--admin-border)]">
              {pending.slice(0, 20).map((o) => (
                <li
                  key={o.orderId}
                  className="flex justify-between gap-3 py-2.5 text-[13px]"
                >
                  <a
                    href={`/admin/orders/${o.orderId}`}
                    className="font-medium text-[var(--admin-plum)] hover:underline"
                    dir="ltr"
                  >
                    {o.orderId}
                  </a>
                  <span className="text-[var(--admin-text-secondary)]">
                    {o.order.fullName}
                  </span>
                  <span className="admin-num">
                    {formatPrice(
                      o.order.total ??
                        o.order.subtotal + (o.order.deliveryFee ?? 0),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
      </div>
    </AdminShell>
  );
}
