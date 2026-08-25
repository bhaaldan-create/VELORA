import { AdminShell } from "@/components/admin/AdminShell";
import {
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import { FileText } from "@/components/admin/ui/icons";
import { getBusinessOverview } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toCsv(rows: string[][]) {
  return rows
    .map((r) =>
      r
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
}

export default async function AdminReportsPage() {
  const [month, lastMonth] = await Promise.all([
    getBusinessOverview("thisMonth"),
    getBusinessOverview("lastMonth"),
  ]);

  const csv = toCsv([
    ["metric", "this_month", "last_month"],
    ["revenue", String(month.revenue), String(lastMonth.revenue)],
    ["orders", String(month.orders), String(lastMonth.orders)],
    ["units", String(month.unitsSold), String(lastMonth.unitsSold)],
    ["aov", String(month.aov), String(lastMonth.aov)],
    [
      "gross_profit",
      month.grossProfit === null ? "insufficient" : String(month.grossProfit),
      lastMonth.grossProfit === null ? "insufficient" : String(lastMonth.grossProfit),
    ],
    [
      "net_profit",
      month.netProfit === null ? "insufficient" : String(month.netProfit),
      lastMonth.netProfit === null ? "insufficient" : String(lastMonth.netProfit),
    ],
    ["expenses", String(month.operatingExpenses), String(lastMonth.operatingExpenses)],
    ["payroll", String(month.payroll), String(lastMonth.payroll)],
  ]);

  return (
    <AdminShell active="reports" title="التقارير">
      <div className="space-y-6">
        <PageHeader
          title="مركز التقارير"
          description="مقارنة هذا الشهر بالسابق — من بيانات حقيقية فقط."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="إيراد هذا الشهر" value={month.revenue} format="iqd" icon={FileText} />
          <StatCard label="إيراد الشهر الماضي" value={lastMonth.revenue} format="iqd" />
          <StatCard label="طلبات هذا الشهر" value={month.orders} format="number" />
          <StatCard label="طلبات السابق" value={lastMonth.orders} format="number" />
        </div>

        <Surface className="p-4">
          <h2 className="mb-2 text-[13px] font-semibold">تصدير CSV</h2>
          <p className="mb-3 text-[12px] text-[var(--admin-text-muted)]">
            انسخي المحتوى أو احفظيه كملف. الربح يظهر «insufficient» إن نقصت التكلفة الواصلة.
          </p>
          <pre
            className="max-h-64 overflow-auto rounded-[12px] bg-[var(--admin-surface-2)] p-3 text-[11px] leading-relaxed"
            dir="ltr"
          >
            {csv}
          </pre>
          <p className="mt-3 text-[12px] text-[var(--admin-text-muted)]">
            متوسط الطلب هذا الشهر:{" "}
            {month.orders > 0 ? formatPrice(month.aov) : "—"}
          </p>
        </Surface>
      </div>
    </AdminShell>
  );
}
