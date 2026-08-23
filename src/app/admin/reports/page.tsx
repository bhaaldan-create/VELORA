import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import { FileText } from "@/components/admin/ui/icons";
import { getAdminOverview } from "@/lib/admin/stats";
import { listStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [overview, orders] = await Promise.all([
    getAdminOverview(),
    listStoredOrders(),
  ]);

  const today = overview.todayOrders;
  const todaySales = overview.todaySales;

  return (
    <AdminShell active="reports" title="التقارير">
      <div className="space-y-6">
        <PageHeader
          title="التقارير"
          description="ملخص يومي وأسبوعي سريع للعمليات."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="مبيعات اليوم"
            value={todaySales}
            format="iqd"
            icon={FileText}
          />
          <StatCard label="طلبات اليوم" value={today} format="number" />
          <StatCard
            label="إجمالي الطلبات"
            value={orders.length}
            format="number"
          />
          <StatCard
            label="مبيعات الأسبوع"
            value={overview.kpis[0]?.value ?? 0}
            format="iqd"
            deltaPct={overview.kpis[0]?.deltaPct}
          />
        </div>

        <Surface>
          <h2 className="mb-3 text-[13px] font-semibold">تصدير سريع</h2>
          <p className="text-[13px] text-[var(--admin-text-secondary)]">
            البيانات متاحة داخل لوحة الطلبات والمنتجات. تصدير CSV الكامل يمكن
            إضافته لاحقاً دون تغيير منطق الأعمال الحالي.
          </p>
          <p className="mt-4 admin-num text-[12px] text-[var(--admin-text-muted)]">
            متوسط اليوم:{" "}
            {today > 0 ? formatPrice(Math.round(todaySales / today)) : "—"}
          </p>
        </Surface>
      </div>
    </AdminShell>
  );
}
