import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import { getHrStats } from "@/lib/admin-hr";
import { getBusinessOverview } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPayrollPage() {
  const [hr, overview] = await Promise.all([
    getHrStats(),
    getBusinessOverview("thisMonth"),
  ]);

  const monthPayroll = hr.monthPayrollTotal || 0;
  const revenue = overview.revenue || 0;
  const pctRevenue = revenue > 0 ? Math.round((monthPayroll / revenue) * 1000) / 10 : null;
  const expenses = overview.operatingExpenses + monthPayroll;
  const pctExpenses =
    expenses > 0 ? Math.round((monthPayroll / expenses) * 1000) / 10 : null;

  return (
    <AdminShell active="payroll" title="الرواتب">
      <div className="space-y-5">
        <PageHeader
          title="الرواتب"
          description="المصدر: الموظفون والحضور والسلف/المكافآت في نظام الموارد البشرية."
          actions={
            <Link
              href="/admin/employees"
              className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-[12px]"
            >
              إدارة الموظفين
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="رواتب الشهر" value={monthPayroll} format="iqd" />
          <StatCard label="موظفون نشطون" value={hr.active} format="number" />
          <StatCard
            label="% من الإيراد"
            value={pctRevenue ?? 0}
            format="number"
          />
          <StatCard
            label="% من المصروف"
            value={pctExpenses ?? 0}
            format="number"
          />
        </div>
        <Surface className="p-4 text-[13px] text-[var(--admin-text-muted)]">
          {revenue === 0
            ? "لا إيرادات بعد الإطلاق — نسب الرواتب من الإيراد ستظهر بعد أول مبيعات."
            : `الرواتب تمثل ${pctRevenue}% من إيراد هذا الشهر (${formatPrice(revenue)}).`}
        </Surface>
      </div>
    </AdminShell>
  );
}
