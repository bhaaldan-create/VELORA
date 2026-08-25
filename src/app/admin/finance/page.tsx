import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import { getBusinessOverview } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const [month, last30] = await Promise.all([
    getBusinessOverview("thisMonth"),
    getBusinessOverview("last30"),
  ]);

  return (
    <AdminShell active="finance" title="التدفق النقدي">
      <div className="space-y-5">
        <PageHeader
          title="التدفق النقدي"
          description="السيولة تختلف عن الربح المحاسبي. الداخل من الطلبات المدفوعة/المسلّمة؛ الخارج من مصروفات ورواتب واستيراد."
        />
        <p className="text-[12px] font-medium text-[var(--admin-text-muted)]">
          هذا الشهر
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="داخل" value={month.cashIn} format="iqd" tone="success" />
          <StatCard label="خارج" value={month.cashOut} format="iqd" tone="warning" />
          <StatCard label="صافي التدفق" value={month.netCashFlow} format="iqd" />
          <StatCard label="تكاليف استيراد" value={month.importCosts} format="iqd" />
        </div>
        <p className="text-[12px] font-medium text-[var(--admin-text-muted)]">
          آخر ٣٠ يوماً
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="داخل ٣٠ يوماً" value={last30.cashIn} format="iqd" />
          <StatCard label="خارج ٣٠ يوماً" value={last30.cashOut} format="iqd" />
          <StatCard label="صافي ٣٠ يوماً" value={last30.netCashFlow} format="iqd" />
        </div>
        <Surface className="space-y-2 p-4 text-[13px]">
          <p>مصروفات تشغيل (الشهر): {formatPrice(month.operatingExpenses)}</p>
          <p>رواتب تقديري (الشهر): {formatPrice(month.payroll)}</p>
          <p className="text-[var(--admin-text-muted)]">
            الربح المحاسبي لهذا الشهر:{" "}
            {month.netProfit === null
              ? "بيانات غير كافية"
              : formatPrice(month.netProfit)}
          </p>
        </Surface>
      </div>
    </AdminShell>
  );
}
