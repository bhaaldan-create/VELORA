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
import { getBusinessOverview } from "@/lib/finance/overview";
import { listAdminProducts } from "@/lib/admin-products";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [month, products] = await Promise.all([
    getBusinessOverview("thisMonth"),
    listAdminProducts(),
  ]);

  return (
    <AdminShell active="analytics" title="التحليلات">
      <div className="space-y-6">
        <PageHeader
          title="التحليلات"
          description="مؤشرات الأداء من بيانات الطلبات والمنتجات الفعلية."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="إيراد الشهر"
            value={month.revenue}
            format="iqd"
            icon={ChartColumn}
          />
          <StatCard
            label="الطلبات"
            value={month.orders}
            format="number"
            icon={ShoppingBag}
          />
          <StatCard
            label="متوسط الطلب"
            value={month.aov}
            format="iqd"
            icon={Users}
          />
          <StatCard
            label="وحدات مباعة"
            value={month.unitsSold}
            format="number"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Surface>
            <h2 className="mb-4 text-[13px] font-semibold">أعلى المنتجات مبيعاً</h2>
            {month.salesByProduct.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
                لا مبيعات بعد
              </p>
            ) : (
              <ul className="space-y-2.5">
                {month.salesByProduct.slice(0, 8).map((p) => (
                  <li
                    key={p.key}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="admin-num text-[11px] text-[var(--admin-text-muted)]">
                        {p.units} قطعة
                      </p>
                    </div>
                    <span className="admin-num shrink-0 font-semibold">
                      {formatPrice(Math.round(p.revenue))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <Surface>
            <h2 className="mb-4 text-[13px] font-semibold">المخزون والربحية</h2>
            <dl className="space-y-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[var(--admin-text-secondary)]">قيمة التجزئة</dt>
                <dd className="admin-num font-medium">
                  {formatPrice(month.inventoryRetailValue)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--admin-text-secondary)]">قيمة التكلفة</dt>
                <dd className="admin-num font-medium">
                  {month.inventoryCostValue === null
                    ? "بيانات غير كافية"
                    : formatPrice(month.inventoryCostValue)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--admin-text-secondary)]">منخفض المخزون</dt>
                <dd className="admin-num font-medium">{month.lowStock}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--admin-border)] pt-3">
                <dt className="text-[var(--admin-text-secondary)]">منتجات الكتالوج</dt>
                <dd className="admin-num font-medium">{products.length}</dd>
              </div>
              {month.insufficientCostNote ? (
                <p className="text-[12px] text-[var(--admin-warning)]">
                  {month.insufficientCostNote}
                </p>
              ) : null}
            </dl>
          </Surface>
        </div>
      </div>
    </AdminShell>
  );
}
