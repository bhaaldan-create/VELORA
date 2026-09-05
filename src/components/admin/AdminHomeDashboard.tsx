"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "@/components/admin/ui/icons";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import type { RankedProductCard } from "@/lib/admin/home-ranks";
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

function greetingForHour(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مساء الخير";
  return "مساء الخير";
}

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
            className="w-full rounded-t-sm"
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

export function AdminHomeDashboard({
  initial,
  greetingName,
  initialTop,
  initialLeast,
}: {
  initial: BusinessOverview;
  greetingName: string;
  initialTop: RankedProductCard[];
  initialLeast: RankedProductCard[];
}) {
  const [data, setData] = useState(initial);
  const [topProducts, setTopProducts] = useState(initialTop);
  const [leastProducts, setLeastProducts] = useState(initialLeast);
  const [period, setPeriod] = useState<PeriodKey>("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [pending, startTransition] = useTransition();

  const now = new Date();
  const dateLabel = now.toLocaleDateString("ar-IQ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
      if (!json.ok) return;
      setData(json.data as BusinessOverview);
      const ranksRes = await fetch(`/api/admin/home-ranks?${q}`);
      const ranksJson = await ranksRes.json();
      if (ranksJson.ok) {
        setTopProducts(ranksJson.top);
        setLeastProducts(ranksJson.least);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] border border-[var(--admin-border)] bg-[linear-gradient(145deg,#ffffff_0%,#f6f1fb_48%,#efe8f6_100%)] px-5 py-6 shadow-[var(--admin-shadow)] sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -start-16 top-[-30%] size-56 rounded-full bg-[radial-gradient(circle,rgba(154,134,190,0.28),transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -end-10 bottom-[-40%] size-48 rounded-full bg-[radial-gradient(circle,rgba(212,181,184,0.35),transparent_70%)]"
          aria-hidden
        />

        <div className="relative flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
            <div className="relative mb-4 h-[4.5rem] w-[13.5rem] sm:h-[5.25rem] sm:w-[16rem]">
              <Image
                src="/brand/velora-admin-logo.jpg"
                alt="VELORA Admin Control Board"
                fill
                className="object-contain object-center lg:object-right"
                sizes="(max-width: 640px) 216px, 256px"
                priority
              />
            </div>
            <p className="text-[12px] text-[var(--admin-text-muted)]">
              {greetingForHour()} · {dateLabel}
            </p>
            <h1 className="mt-1.5 text-[1.55rem] font-semibold tracking-tight text-[var(--admin-plum)] sm:text-[1.85rem]">
              أهلاً بالأدمن {greetingName}
            </h1>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[var(--admin-text-secondary)]">
              هذه رئيسيتك — ملخص المبيعات، المنتجات الأقوى والأضعف، وما يحتاج
              انتباهك اليوم.
            </p>
          </div>

          <div className="flex w-full max-w-lg flex-col items-stretch gap-2 lg:items-end">
            <div className="flex flex-wrap justify-center gap-1.5 lg:justify-end">
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
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                    period === p.key
                      ? "bg-[var(--admin-plum)] text-white shadow-sm"
                      : "bg-white/80 text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {period === "custom" ? (
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                <input
                  type="date"
                  className="rounded-lg border border-[var(--admin-border)] bg-white px-2 py-1 text-[12px]"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  dir="ltr"
                />
                <span className="text-[11px] text-[var(--admin-text-muted)]">→</span>
                <input
                  type="date"
                  className="rounded-lg border border-[var(--admin-border)] bg-white px-2 py-1 text-[12px]"
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
            {pending ? (
              <p className="text-center text-[11px] text-[var(--admin-text-muted)] lg:text-end">
                جاري تحديث الأرقام…
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {data.insufficientCostNote ? (
        <Surface className="flex items-start gap-2 border-[var(--admin-warning)]/30 bg-[var(--admin-warning)]/5 px-4 py-3 text-[13px] text-[var(--admin-text)]">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--admin-warning)]" />
          {data.insufficientCostNote}
        </Surface>
      ) : null}

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="الإيرادات"
          value={data.revenue}
          format="iqd"
          icon={Wallet}
          footnote="صافي المبيعات للفترة"
        />
        <StatCard
          label="الطلبات"
          value={data.orders}
          format="number"
          icon={ShoppingBag}
        />
        <StatCard
          label="صافي الربح"
          value={data.netProfit ?? 0}
          format="iqd"
          tone={data.netProfit === null ? "warning" : "success"}
          displayOverride={data.netProfit === null ? "غير كافٍ" : undefined}
          icon={TrendingUp}
          footnote={
            data.netMarginPct !== null
              ? `هامش صافي ${data.netMarginPct}%`
              : "إيراد − تكلفة − مصروف − رواتب"
          }
        />
        <StatCard
          label="الوحدات المباعة"
          value={data.unitsSold}
          format="number"
          icon={Package}
        />
      </div>

      {/* Top / least sold */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProductRankPanel
          title="الأكثر مبيعاً"
          subtitle="أعلى وحدات مباعة في الفترة"
          icon={TrendingUp}
          tone="up"
          products={topProducts}
          empty="لا مبيعات بعد في هذه الفترة."
        />
        <ProductRankPanel
          title="الأقل مبيعاً"
          subtitle="أضعف حركة في الكتالوج النشط"
          icon={TrendingDown}
          tone="down"
          products={leastProducts}
          empty="لا منتجات نشطة لعرضها."
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="الربح الإجمالي"
          value={data.grossProfit ?? 0}
          format="iqd"
          tone={data.grossProfit === null ? "warning" : "default"}
          displayOverride={data.grossProfit === null ? "غير كافٍ" : undefined}
          footnote={
            data.grossMarginPct !== null
              ? `هامش ${data.grossMarginPct}%`
              : undefined
          }
        />
        <StatCard label="متوسط الطلب" value={data.aov} format="iqd" />
        <StatCard
          label="منخفض المخزون"
          value={data.lowStock}
          format="number"
          tone="warning"
        />
        <StatCard
          label="نفد المخزون"
          value={data.outOfStock}
          format="number"
          tone="danger"
        />
        <StatCard label="المصروفات" value={data.operatingExpenses} format="iqd" />
        <StatCard
          label="قيد الانتظار"
          value={data.pendingOrders}
          format="number"
          tone="info"
        />
      </div>

      {/* Charts */}
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
          <MiniBars
            series={data.ordersSeries}
            color="var(--admin-info, #7c8db5)"
          />
        </Surface>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="mb-2 text-[12px] font-medium">حسب التصنيف</p>
          <ul className="space-y-1.5 text-[12px]">
            {data.salesByCategory.length === 0 ? (
              <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد</li>
            ) : (
              data.salesByCategory.slice(0, 6).map((r) => (
                <li key={r.key} className="flex justify-between gap-2">
                  <span className="truncate">{r.key}</span>
                  <span className="admin-num shrink-0" dir="ltr">
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
              <li className="text-[var(--admin-text-muted)]">لا مبيعات بعد</li>
            ) : (
              data.salesByBrand.slice(0, 6).map((r) => (
                <li key={r.key} className="flex justify-between gap-2">
                  <span className="truncate">{r.key}</span>
                  <span className="admin-num shrink-0" dir="ltr">
                    {formatPrice(Math.round(r.revenue))}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Surface>
        <Surface className="p-4">
          <p className="mb-3 text-[12px] font-medium">اختصارات سريعة</p>
          <div className="flex flex-col gap-2 text-[13px]">
            <Link
              href="/admin/orders?status=new"
              className="text-[var(--admin-plum-soft)] hover:underline"
            >
              الطلبات الجديدة
            </Link>
            <Link
              href="/admin/products"
              className="text-[var(--admin-plum-soft)] hover:underline"
            >
              إدارة المنتجات
            </Link>
            <Link
              href="/admin/inventory"
              className="text-[var(--admin-plum-soft)] hover:underline"
            >
              المخزون
            </Link>
            <Link
              href="/admin/sales"
              className="text-[var(--admin-plum-soft)] hover:underline"
            >
              تفاصيل المبيعات
            </Link>
            <Link
              href="/admin/ai"
              className="text-[var(--admin-plum-soft)] hover:underline"
            >
              وكيل الأعمال الذكي
            </Link>
          </div>
        </Surface>
      </div>

      {/* Keep PageHeader out of hero — finance deep-dive remains on /admin/sales */}
      <PageHeader
        title="تحليل أعمق"
        description="للأرقام التفصيلية والربحية والتدفق النقدي انتقلي إلى أقسام المالية والمبيعات."
        actions={
          <Link
            href="/admin/sales"
            className="rounded-full bg-[var(--admin-plum)] px-4 py-2 text-[12px] font-medium text-white"
          >
            فتح المبيعات
          </Link>
        }
      />
    </div>
  );
}

function ProductRankPanel({
  title,
  subtitle,
  icon: Icon,
  tone,
  products,
  empty,
}: {
  title: string;
  subtitle: string;
  icon: typeof TrendingUp;
  tone: "up" | "down";
  products: RankedProductCard[];
  empty: string;
}) {
  const accent =
    tone === "up"
      ? "text-[var(--admin-success)] bg-[var(--admin-success)]/10"
      : "text-[var(--admin-warning)] bg-[var(--admin-warning)]/10";

  return (
    <Surface className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3.5">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]">
            {subtitle}
          </p>
        </div>
        <span
          className={`flex size-8 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="size-4" strokeWidth={1.7} />
        </span>
      </div>

      {products.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-[var(--admin-text-muted)]">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--admin-border)]">
          {products.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--admin-surface-soft)]/70"
              >
                <span className="admin-num w-5 shrink-0 text-center text-[11px] text-[var(--admin-text-muted)]">
                  {i + 1}
                </span>
                <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-[var(--admin-surface-soft)] ring-1 ring-[var(--admin-border)]">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="size-full object-contain p-1"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[var(--admin-text-muted)]">
                      <Package className="size-4" strokeWidth={1.5} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--admin-text)]">
                    {p.nameAr}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--admin-text-muted)]">
                    {p.brandName}
                  </p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="admin-num text-[13px] font-semibold text-[var(--admin-text)]">
                    {p.units.toLocaleString("ar-IQ")}
                    <span className="ms-1 text-[10px] font-normal text-[var(--admin-text-muted)]">
                      وحدة
                    </span>
                  </p>
                  <p className="admin-num mt-0.5 text-[11px] text-[var(--admin-text-muted)]">
                    {formatPrice(Math.round(p.revenue))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
