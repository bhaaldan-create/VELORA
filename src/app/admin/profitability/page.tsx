import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import { listProductProfitability } from "@/lib/finance/overview";
import { getBusinessOverview } from "@/lib/finance/overview";
import { computeBreakEven } from "@/lib/finance/breakeven";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProfitabilityPage() {
  const [rows, overview] = await Promise.all([
    listProductProfitability(),
    getBusinessOverview("thisMonth"),
  ]);

  const withMargin = rows
    .filter((r) => r.cost.hasCostData && r.cost.grossMarginPct !== null)
    .sort((a, b) => (b.cost.grossMarginPct || 0) - (a.cost.grossMarginPct || 0));

  const breakEven = computeBreakEven({
    monthlyFixedCostsIqd: overview.operatingExpenses + overview.payroll,
    averageGrossMarginPct: overview.grossMarginPct,
    averageOrderValueIqd: overview.aov || 0,
  });

  return (
    <AdminShell active="profitability" title="الربحية">
      <div className="space-y-5">
        <PageHeader
          title="مركز الربحية"
          description="منتج → تكلفة واصلة → بيع → هامش. بدون تكلفة مسجّلة = بيانات غير كافية."
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="إيراد الشهر" value={overview.revenue} format="iqd" />
          <StatCard
            label="ربح إجمالي"
            value={overview.grossProfit ?? 0}
            format={overview.grossProfit === null ? "number" : "iqd"}
          />
          <StatCard
            label="صافي"
            value={overview.netProfit ?? 0}
            format={overview.netProfit === null ? "number" : "iqd"}
          />
          <StatCard
            label="هامش %"
            value={overview.grossMarginPct ?? 0}
            format="number"
          />
        </div>

        <Surface className="p-4 text-[13px]">
          <p className="font-medium">نقطة التعادل</p>
          <p className="mt-2 text-[var(--admin-text-muted)]">{breakEven.explanationAr}</p>
          {breakEven.breakEvenRevenueIqd !== null ? (
            <p className="mt-2 admin-num" dir="ltr">
              {formatPrice(breakEven.breakEvenRevenueIqd)}
              {breakEven.breakEvenOrders !== null
                ? ` · ~${breakEven.breakEvenOrders} طلب`
                : ""}
            </p>
          ) : null}
        </Surface>

        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-[12px]">
            <thead className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">المنتج</th>
                <th className="px-3 py-2 font-medium">العلامة</th>
                <th className="px-3 py-2 font-medium">تكلفة واصلة</th>
                <th className="px-3 py-2 font-medium">صافي البيع</th>
                <th className="px-3 py-2 font-medium">ربح</th>
                <th className="px-3 py-2 font-medium">هامش %</th>
              </tr>
            </thead>
            <tbody>
              {withMargin.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-[var(--admin-text-muted)]">
                    لا توجد منتجات بتكلفة واصلة بعد.{" "}
                    <Link href="/admin/products" className="text-[var(--admin-accent)]">
                      أضيفي التكاليف من صفحة المنتج
                    </Link>
                    {" "}أو{" "}
                    <Link href="/admin/imports" className="text-[var(--admin-accent)]">
                      استيراد
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                withMargin.map((r) => (
                  <tr key={r.productId} className="border-b border-[var(--admin-border)]/60">
                    <td className="px-3 py-2">{r.nameAr}</td>
                    <td className="px-3 py-2">{r.brandName}</td>
                    <td className="px-3 py-2 admin-num" dir="ltr">
                      {formatPrice(Math.round(r.cost.landedCostIqd))}
                    </td>
                    <td className="px-3 py-2 admin-num" dir="ltr">
                      {formatPrice(r.cost.netSellingPrice)}
                    </td>
                    <td className="px-3 py-2 admin-num" dir="ltr">
                      {formatPrice(Math.round(r.cost.grossProfit || 0))}
                    </td>
                    <td className="px-3 py-2">
                      {r.cost.grossMarginPct}%
                      {r.cost.belowMinMargin ? " ⚠" : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Surface>
      </div>
    </AdminShell>
  );
}
