import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import { getBusinessOverview } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const data = await getBusinessOverview("thisMonth");

  return (
    <AdminShell active="finance" title="التدفق النقدي">
      <div className="space-y-5">
        <PageHeader
          title="التدفق النقدي"
          description="السيولة تختلف عن الربح المحاسبي. الداخل من الطلبات المدفوعة/المسلّمة؛ الخارج من مصروفات ورواتب واستيراد."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="داخل" value={data.cashIn} format="iqd" tone="success" />
          <StatCard label="خارج" value={data.cashOut} format="iqd" tone="warning" />
          <StatCard label="صافي التدفق" value={data.netCashFlow} format="iqd" />
          <StatCard label="تكاليف استيراد" value={data.importCosts} format="iqd" />
        </div>
        <Surface className="space-y-2 p-4 text-[13px]">
          <p>مصروفات تشغيل: {formatPrice(data.operatingExpenses)}</p>
          <p>رواتب (تقديري للفترة): {formatPrice(data.payroll)}</p>
          <p className="text-[var(--admin-text-muted)]">
            الربح المحاسبي لهذا الشهر:{" "}
            {data.netProfit === null
              ? "بيانات غير كافية"
              : formatPrice(data.netProfit)}
          </p>
        </Surface>
      </div>
    </AdminShell>
  );
}
