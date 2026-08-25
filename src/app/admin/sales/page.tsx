import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import { getBusinessOverview } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  const data = await getBusinessOverview("thisMonth");

  return (
    <AdminShell active="sales" title="المبيعات">
      <div className="space-y-5">
        <PageHeader title="تحليلات المبيعات" description="هذا الشهر مقابل بيانات فعلية فقط." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="الإيراد" value={data.revenue} format="iqd" />
          <StatCard label="الطلبات" value={data.orders} format="number" />
          <StatCard label="الوحدات" value={data.unitsSold} format="number" />
          <StatCard label="متوسط الطلب" value={data.aov} format="iqd" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Surface className="p-4">
            <p className="mb-2 text-[12px] font-medium">أفضل المنتجات</p>
            <ul className="space-y-1.5 text-[12px]">
              {data.salesByProduct.length === 0 ? (
                <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد</li>
              ) : (
                data.salesByProduct.slice(0, 10).map((p) => (
                  <li key={p.key} className="flex justify-between gap-2">
                    <span>{p.name}</span>
                    <span className="admin-num" dir="ltr">{formatPrice(Math.round(p.revenue))}</span>
                  </li>
                ))
              )}
            </ul>
          </Surface>
          <Surface className="p-4">
            <p className="mb-2 text-[12px] font-medium">حسب العلامة</p>
            <ul className="space-y-1.5 text-[12px]">
              {data.salesByBrand.length === 0 ? (
                <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد</li>
              ) : (
                data.salesByBrand.slice(0, 10).map((p) => (
                  <li key={p.key} className="flex justify-between gap-2">
                    <span>{p.key}</span>
                    <span className="admin-num" dir="ltr">{formatPrice(Math.round(p.revenue))}</span>
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
