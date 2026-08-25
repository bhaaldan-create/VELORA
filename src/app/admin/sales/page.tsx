import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import { getBusinessOverview } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

function deltaPct(now: number, prev: number) {
  if (prev === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - prev) / prev) * 1000) / 10;
}

export default async function AdminSalesPage() {
  const [month, lastMonth] = await Promise.all([
    getBusinessOverview("thisMonth"),
    getBusinessOverview("lastMonth"),
  ]);

  return (
    <AdminShell active="sales" title="المبيعات">
      <div className="space-y-5">
        <PageHeader
          title="تحليلات المبيعات"
          description="هذا الشهر مقابل الشهر الماضي — بيانات فعلية فقط."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="إيراد هذا الشهر"
            value={month.revenue}
            format="iqd"
            deltaPct={deltaPct(month.revenue, lastMonth.revenue)}
          />
          <StatCard
            label="طلبات هذا الشهر"
            value={month.orders}
            format="number"
            deltaPct={deltaPct(month.orders, lastMonth.orders)}
          />
          <StatCard label="الوحدات" value={month.unitsSold} format="number" />
          <StatCard label="متوسط الطلب" value={month.aov} format="iqd" />
        </div>
        <Surface className="p-4 text-[13px] text-[var(--admin-text-muted)]">
          الشهر الماضي: {formatPrice(lastMonth.revenue)} إيراد · {lastMonth.orders}{" "}
          طلب.{" "}
          {month.orders === 0
            ? "لا مبيعات بعد الإطلاق — المقارنات ستظهر بعد أول طلبات حقيقية."
            : null}
        </Surface>
        <div className="grid gap-3 lg:grid-cols-2">
          <Surface className="p-4">
            <p className="mb-2 text-[12px] font-medium">أفضل المنتجات</p>
            <ul className="space-y-1.5 text-[12px]">
              {month.salesByProduct.length === 0 ? (
                <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد</li>
              ) : (
                month.salesByProduct.slice(0, 10).map((p) => (
                  <li key={p.key} className="flex justify-between gap-2">
                    <span>{p.name}</span>
                    <span className="admin-num" dir="ltr">
                      {formatPrice(Math.round(p.revenue))}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Surface>
          <Surface className="p-4">
            <p className="mb-2 text-[12px] font-medium">حسب العلامة</p>
            <ul className="space-y-1.5 text-[12px]">
              {month.salesByBrand.length === 0 ? (
                <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد</li>
              ) : (
                month.salesByBrand.slice(0, 10).map((p) => (
                  <li key={p.key} className="flex justify-between gap-2">
                    <span>{p.key}</span>
                    <span className="admin-num" dir="ltr">
                      {formatPrice(Math.round(p.revenue))}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Surface>
        </div>
      </div>
    </AdminShell>
  );
}
