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
  { key: "custom", label: "مخصص" },
];

function MiniBars({
  series,
  color = "var(--admin-accent)",
}: {
  series: { date: string; value: number | null }[];
  color?: string;
}) {
  const nums = series.map((s) => s.value ?? 0);
  const max = Math.max(1, ...nums);
  const slice = series.slice(-14);
  return (
    <div className="flex h-24 items-end gap-1">
      {slice.map((s) => (
        <div key={s.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm opacity-80"
            style={{
              height: `${Math.max(4, ((s.value ?? 0) / max) * 100)}%`,
              background: color,
              opacity: s.value === null ? 0.25 : 0.85,
            }}
            title={`${s.date}: ${s.value === null ? "غير كافٍ" : s.value}`}
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
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [pending, startTransition] = useTransition();

  function load(next: PeriodKey, from?: string, to?: string) {
    setPeriod(next);
    startTransition(async () => {
      const q = new URLSearchParams({ period: next });
      if (next === "custom") {
        if (from) q.set("from", from);
        if (to) q.set("to", to);
      }
      const res = await fetch(`/api/admin/finance/overview?${q}`);
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
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-1.5">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    if (p.key === "custom") {
                      setPeriod("custom");
                      return;
                    }
                    load(p.key);
                  }}
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
            {period === "custom" ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 text-[12px]"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  dir="ltr"
                />
                <span className="text-[11px] text-[var(--admin-text-muted)]">→</span>
                <input
                  type="date"
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 text-[12px]"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="rounded-full bg-[var(--admin-plum)] px-3 py-1 text-[11px] text-white"
                  onClick={() => load("custom", customFrom, customTo)}
                >
                  تطبيق
                </button>
              </div>
            ) : null}
          </div>
        }
      />

      {pending ? (
        <p className="text-[12px] text-[var(--admin-text-muted)]">جاري التحديث…</p>
      ) : null}

      <Surface className="border-[var(--admin-border)] bg-[var(--admin-surface-2)]/40 px-4 py-3 text-[12px] text-[var(--admin-text-secondary)]">
        الإيراد = ما دخل من المبيعات · الربح = الإيراد − التكلفة الواصلة − المصروفات − الرواتب.
        {data.orders === 0
          ? " الحالة الحالية: ما قبل الإطلاق — لا طلبات بعد."
          : ""}
      </Surface>

      {data.insufficientCostNote ? (
        <Surface className="border-[var(--admin-warning)]/30 bg-[var(--admin-warning)]/5 px-4 py-3 text-[13px] text-[var(--admin-text)]">
          {data.insufficientCostNote}
        </Surface>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="الإيرادات" value={data.revenue} format="iqd" footnote="صافي المبيعات للفترة" />
        <StatCard
          label="الربح الإجمالي"
          value={data.grossProfit ?? 0}
          format="iqd"
          tone={data.grossProfit === null ? "warning" : "success"}
          displayOverride={data.grossProfit === null ? "غير كافٍ" : undefined}
          footnote={
            data.grossMarginPct !== null
              ? `هامش ${data.grossMarginPct}%`
              : "يحتاج تكلفة واصلة"
          }
        />
        <StatCard
          label="صافي الربح"
          value={data.netProfit ?? 0}
          format="iqd"
          tone={data.netProfit === null ? "warning" : "default"}
          displayOverride={data.netProfit === null ? "غير كافٍ" : undefined}
          footnote={
            data.netMarginPct !== null
              ? `هامش صافي ${data.netMarginPct}%`
              : "إيراد − تكلفة − مصروف − رواتب"
          }
        />
        <StatCard label="الطلبات" value={data.orders} format="number" />
        <StatCard label="متوسط الطلب" value={data.aov} format="iqd" />
        <StatCard label="الوحدات المباعة" value={data.unitsSold} format="number" />
        <StatCard label="قيمة المخزون (بيع)" value={data.inventoryRetailValue} format="iqd" />
        <StatCard
          label="قيمة المخزون (تكلفة)"
          value={data.inventoryCostValue ?? 0}
          format="iqd"
          tone={data.inventoryCostValue === null ? "warning" : "info"}
          displayOverride={
            data.inventoryCostValue === null ? "غير كافٍ" : undefined
          }
        />
        <StatCard label="منخفض المخزون" value={data.lowStock} format="number" tone="warning" />
        <StatCard label="نفد المخزون" value={data.outOfStock} format="number" tone="danger" />
        <StatCard label="المصروفات" value={data.operatingExpenses} format="iqd" />
        <StatCard label="الرواتب (تقديري)" value={data.payroll} format="iqd" />
        <StatCard label="تكاليف استيراد" value={data.importCosts} format="iqd" />
        <StatCard label="التدفق النقدي" value={data.netCashFlow} format="iqd" />
        <StatCard label="قيد الانتظار" value={data.pendingOrders} format="number" tone="info" />
        <StatCard label="ملغاة / مرتجع" value={data.cancelledOrders + data.returns} format="number" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium text-[var(--admin-text-muted)]">
            الإيرادات عبر الوقت
          </p>
          <MiniBars series={data.revenueSeries} />
          <p className="mt-2 text-[11px] text-[var(--admin-text-muted)]">
            الإجمالي: {formatPrice(data.revenue)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium text-[var(--admin-text-muted)]">
            الطلبات عبر الوقت
          </p>
          <MiniBars series={data.ordersSeries} color="var(--admin-info, #7c8db5)" />
        </Surface>
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium text-[var(--admin-text-muted)]">
            الربح عبر الوقت
          </p>
          <MiniBars
            series={data.profitSeries}
            color="var(--admin-success, #5a8f6a)"
          />
          <p className="mt-2 text-[11px] text-[var(--admin-text-muted)]">
            الأشرطة الباهتة = بيانات تكلفة غير كافية لذلك اليوم
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium text-[var(--admin-text-muted)]">
            المصروفات عبر الوقت
          </p>
          <MiniBars
            series={data.expensesSeries}
            color="var(--admin-warning, #c4a35a)"
          />
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
            <Link href="/admin/alerts" className="text-[var(--admin-accent)] hover:underline">
              التنبيهات
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
