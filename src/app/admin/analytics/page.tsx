import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import {
  ChartColumn,
  ShoppingBag,
  Users,
} from "@/components/admin/ui/icons";
import { getAdminOverview } from "@/lib/admin/stats";
import { listAdminProducts } from "@/lib/admin-products";
import { listStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [overview, orders, products] = await Promise.all([
    getAdminOverview(),
    listStoredOrders(),
    listAdminProducts(),
  ]);

  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.order.items) {
      const cur = productSales.get(item.id) || {
        name: item.nameAr || item.name,
        qty: 0,
        revenue: 0,
      };
      cur.qty += item.quantity;
      cur.revenue += item.price * item.quantity;
      productSales.set(item.id, cur);
    }
  }
  const topProducts = [...productSales.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const cancelled = orders.filter(
    (o) => o.status === "cancelled" || o.status === "failed_delivery",
  ).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelRate =
    orders.length > 0 ? Math.round((cancelled / orders.length) * 1000) / 10 : 0;
  const deliveryRate =
    orders.length > 0 ? Math.round((delivered / orders.length) * 1000) / 10 : 0;

  return (
    <AdminShell active="analytics" title="التحليلات">
      <div className="space-y-6">
        <PageHeader
          title="التحليلات"
          description="مؤشرات الأداء من بيانات الطلبات والمنتجات الفعلية."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {overview.kpis.slice(0, 4).map((k) => (
            <StatCard
              key={k.id}
              label={k.label}
              value={k.value}
              format={k.format}
              deltaPct={k.deltaPct}
              icon={
                k.id === "orders"
                  ? ShoppingBag
                  : k.id === "customers"
                    ? Users
                    : ChartColumn
              }
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Surface>
            <h2 className="mb-4 text-[13px] font-semibold">أعلى المنتجات مبيعاً</h2>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
                لا مبيعات بعد
              </p>
            ) : (
              <ul className="space-y-2.5">
                {topProducts.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="admin-num text-[11px] text-[var(--admin-text-muted)]">
                        {p.qty} قطعة
                      </p>
                    </div>
                    <span className="admin-num shrink-0 font-semibold">
                      {formatPrice(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <Surface>
            <h2 className="mb-4 text-[13px] font-semibold">جودة التنفيذ</h2>
            <dl className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-[12px]">
                  <dt>نسبة التسليم</dt>
                  <dd className="admin-num font-medium">{deliveryRate}%</dd>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--admin-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-success)]"
                    style={{ width: `${Math.min(deliveryRate, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[12px]">
                  <dt>نسبة الإلغاء / الفشل</dt>
                  <dd className="admin-num font-medium">{cancelRate}%</dd>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--admin-surface-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-danger)]/70"
                    style={{ width: `${Math.min(cancelRate, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between border-t border-[var(--admin-border)] pt-3 text-[13px]">
                <span className="text-[var(--admin-text-secondary)]">
                  منتجات في الكتالوج
                </span>
                <span className="admin-num font-medium">{products.length}</span>
              </div>
            </dl>
          </Surface>
        </div>
      </div>
    </AdminShell>
  );
}
