"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import type { BusinessOverview, PeriodKey } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "last7", label: "٧ أيام" },
  { key: "last30", label: "٣٠ يوماً" },
  { key: "thisMonth", label: "هذا الشهر" },
  { key: "lastMonth", label: "الشهر الماضي" },
  { key: "thisYear", label: "هذه السنة" },
];

function MiniBars({
  series,
  color = "var(--admin-accent)",
}: {
  series: { date: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.value));
  const slice = series.slice(-14);
  return (
    <div className="flex h-24 items-end gap-1">
      {slice.map((s) => (
        <div key={s.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm opacity-80"
            style={{
              height: `${Math.max(4, (s.value / max) * 100)}%`,
              background: color,
            }}
            title={`${s.date}: ${s.value}`}
          />
        </div>
      ))}
    </div>
  );
}

function moneyOrDash(v: number | null) {
  if (v === null) return "غير كافٍ";
  return formatPrice(Math.round(v));
}

export function BusinessOverviewDashboard({
  initial,
}: {
  initial: BusinessOverview;
}) {
  const [data, setData] = useState(initial);
  const [period, setPeriod] = useState<PeriodKey>("last30");
  const [pending, startTransition] = useTransition();

  function load(next: PeriodKey) {
    setPeriod(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/finance/overview?period=${next}`);
      const json = await res.json();
      if (json.ok) setData(json.data);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="نظام تشغيل أعمال VELORA"
        description="إيراد ≠ ربح. الأرقام من قاعدة البيانات فقط — بدون بيانات تجريبية."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => load(p.key)}
                className={`rounded-full px-3 py-1 text-[11px] transition ${
                  period === p.key
                    ? "bg-[var(--admin-accent)] text-white"
                    : "bg-[var(--admin-surface-2)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {pending ? (
        <p className="text-[12px] text-[var(--admin-text-muted)]">جاري التحديث…</p>
      ) : null}

      {data.insufficientCostNote ? (
        <Surface className="border-[var(--admin-warning)]/30 bg-[var(--admin-warning)]/5 px-4 py-3 text-[13px] text-[var(--admin-text)]">
          {data.insufficientCostNote}
        </Surface>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="الإيرادات" value={data.revenue} format="iqd" />
        <StatCard
          label="الربح الإجمالي"
          value={data.grossProfit ?? 0}
          format={data.grossProfit === null ? "number" : "iqd"}
          tone={data.grossProfit === null ? "warning" : "success"}
        />
        <StatCard
          label="صافي الربح"
          value={data.netProfit ?? 0}
          format={data.netProfit === null ? "number" : "iqd"}
          tone={data.netProfit === null ? "warning" : "default"}
        />
        <StatCard label="الطلبات" value={data.orders} format="number" />
        <StatCard label="متوسط الطلب" value={data.aov} format="iqd" />
        <StatCard label="الوحدات المباعة" value={data.unitsSold} format="number" />
        <StatCard label="قيمة المخزون (بيع)" value={data.inventoryRetailValue} format="iqd" />
        <StatCard label="منخفض المخزون" value={data.lowStock} format="number" tone="warning" />
        <StatCard label="المصروفات" value={data.operatingExpenses} format="iqd" />
        <StatCard label="الرواتب (تقديري)" value={data.payroll} format="iqd" />
        <StatCard label="التدفق النقدي" value={data.netCashFlow} format="iqd" />
        <StatCard label="قيد الانتظار" value={data.pendingOrders} format="number" tone="info" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium text-[var(--admin-text-muted)]">
            الإيرادات (آخر ١٤ يوماً في النطاق)
          </p>
          <MiniBars series={data.revenueSeries} />
          <p className="mt-2 text-[11px] text-[var(--admin-text-muted)]">
            الإجمالي: {formatPrice(data.revenue)}
            {data.grossMarginPct !== null
              ? ` · هامش إجمالي ${data.grossMarginPct}%`
              : ""}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium text-[var(--admin-text-muted)]">
            الطلبات
          </p>
          <MiniBars series={data.ordersSeries} color="var(--admin-info, #7c8db5)" />
          <p className="mt-2 text-[11px] text-[var(--admin-text-muted)]">
            ملغاة: {data.cancelledOrders} · مرتجعات: {data.returns}
          </p>
        </Surface>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="mb-2 text-[12px] font-medium">حسب التصنيف</p>
          <ul className="space-y-1.5 text-[12px]">
            {data.salesByCategory.length === 0 ? (
              <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد الإطلاق</li>
            ) : (
              data.salesByCategory.slice(0, 6).map((r) => (
                <li key={r.key} className="flex justify-between gap-2">
                  <span>{r.key}</span>
                  <span className="admin-num" dir="ltr">
                    {formatPrice(Math.round(r.revenue))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Surface>
        <Surface className="p-4">
          <p className="mb-2 text-[12px] font-medium">حسب العلامة</p>
          <ul className="space-y-1.5 text-[12px]">
            {data.salesByBrand.length === 0 ? (
              <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد الإطلاق</li>
            ) : (
              data.salesByBrand.slice(0, 6).map((r) => (
                <li key={r.key} className="flex justify-between gap-2">
                  <span>{r.key}</span>
                  <span className="admin-num" dir="ltr">
                    {formatPrice(Math.round(r.revenue))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Surface>
        <Surface className="p-4">
          <p className="mb-2 text-[12px] font-medium">اختصارات</p>
          <div className="flex flex-col gap-2 text-[12px]">
            <Link href="/admin/ai" className="text-[var(--admin-accent)] hover:underline">
              وكيل الأعمال الذكي
            </Link>
            <Link href="/admin/imports" className="text-[var(--admin-accent)] hover:underline">
              الاستيراد والمخزون
            </Link>
            <Link href="/admin/profitability" className="text-[var(--admin-accent)] hover:underline">
              مركز الربحية
            </Link>
            <Link href="/admin/expenses" className="text-[var(--admin-accent)] hover:underline">
              المصروفات
            </Link>
            <p className="mt-2 text-[var(--admin-text-muted)]">
              تكلفة المخزون: {moneyOrDash(data.inventoryCostValue)}
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
}
