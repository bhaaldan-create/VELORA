import Link from "next/link";
import {
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
  Users,
  Warehouse,
} from "@/components/admin/ui/icons";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { PageHeader, StatCard, Surface } from "@/components/admin/ui/primitives";
import type { AdminOverview } from "@/lib/admin/stats";
import { ORDER_STATUS_LABELS } from "@/lib/order-types";
import { formatPrice } from "@/lib/utils";

const KPI_ICONS = {
  sales: CreditCard,
  orders: ShoppingBag,
  new: ShoppingBag,
  preparing: Package,
  shipping: Truck,
  delivered: Package,
  customers: Users,
  aov: CreditCard,
} as const;

function greetingForHour(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مساء الخير";
  return "مساء الخير";
}

export function OverviewDashboard({ data }: { data: AdminOverview }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("ar-IQ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = now.toLocaleTimeString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greetingForHour()}، ${data.greetingName}`}
        description="إليكِ ملخص VELORA اليوم."
        actions={
          <div className="text-left text-[12px] text-[var(--admin-text-muted)]">
            <p>{dateLabel}</p>
            <p className="admin-num mt-0.5" dir="ltr">
              {timeLabel}
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <StatCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            format={kpi.format}
            deltaPct={kpi.deltaPct}
            tone={kpi.tone}
            icon={KPI_ICONS[kpi.id as keyof typeof KPI_ICONS]}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AttentionChip
          href="/admin/orders?status=new"
          label="تحتاج تأكيداً"
          value={data.attention.newOrders}
          tone="info"
        />
        <AttentionChip
          href="/admin/orders?status=preparing"
          label="قيد التجهيز"
          value={data.attention.preparing}
          tone="warning"
        />
        <AttentionChip
          href="/admin/shipping"
          label="قيد التوصيل"
          value={data.attention.shipping}
          tone="shipping"
        />
        <AttentionChip
          href="/admin/inventory"
          label="مخزون منخفض"
          value={data.attention.lowStock}
          tone="danger"
        />
        <AttentionChip
          href="/admin/payments"
          label="بانتظار الدفع"
          value={data.attention.unpaid}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Surface>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
              أحدث الطلبات
            </h2>
            <Link
              href="/admin/orders"
              className="text-[12px] text-[var(--admin-plum-soft)] hover:underline"
            >
              عرض الكل
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
              لا توجد طلبات بعد — عندما يصل طلب جديد سيظهر هنا.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {data.recentOrders.map((o) => {
                const total =
                  o.order.total ??
                  o.order.subtotal + (o.order.deliveryFee ?? 0);
                return (
                  <li key={o.orderId}>
                    <Link
                      href={`/admin/orders/${o.orderId}`}
                      className="flex items-center gap-3 py-3 transition hover:bg-[var(--admin-surface-soft)]/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="admin-num text-[12px] text-[var(--admin-text-muted)]"
                            dir="ltr"
                          >
                            {o.orderId}
                          </span>
                          <StatusBadge status={o.status} short />
                        </div>
                        <p className="mt-1 truncate text-[13px] font-medium text-[var(--admin-text)]">
                          {o.order.fullName}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="admin-num text-[13px] font-semibold text-[var(--admin-text)]">
                          {formatPrice(total)}
                        </p>
                        <p
                          className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]"
                          dir="ltr"
                        >
                          {new Date(o.savedAt).toLocaleString("ar-IQ", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Surface>

        <Surface>
          <h2 className="mb-4 text-[14px] font-semibold text-[var(--admin-text)]">
            توزيع الحالات
          </h2>
          {data.statusBreakdown.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
              لا بيانات بعد
            </p>
          ) : (
            <ul className="space-y-2.5">
              {data.statusBreakdown.map((row) => {
                const max = Math.max(
                  ...data.statusBreakdown.map((r) => r.count),
                  1,
                );
                const pct = Math.round((row.count / max) * 100);
                return (
                  <li key={row.status}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-[var(--admin-text-secondary)]">
                        {ORDER_STATUS_LABELS[row.status]}
                      </span>
                      <span className="admin-num font-medium text-[var(--admin-text)]">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-surface-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--admin-plum-soft)]/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <QuickLink href="/admin/products" icon={Package} label="المنتجات" />
            <QuickLink href="/admin/inventory" icon={Warehouse} label="المخزون" />
            <QuickLink href="/admin/customers" icon={Users} label="العملاء" />
            <QuickLink href="/admin/shipping" icon={Truck} label="الشحن" />
          </div>
        </Surface>
      </div>
    </div>
  );
}

function AttentionChip({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone: "info" | "warning" | "danger" | "shipping";
}) {
  const colors = {
    info: "border-[var(--admin-info)]/15 bg-[var(--admin-info-bg)]",
    warning: "border-[var(--admin-warning)]/15 bg-[var(--admin-warning-bg)]",
    danger: "border-[var(--admin-danger)]/15 bg-[var(--admin-danger-bg)]",
    shipping:
      "border-[var(--admin-shipping)]/15 bg-[var(--admin-shipping-bg)]",
  }[tone];

  return (
    <Link
      href={href}
      className={`rounded-[var(--admin-radius)] border px-3 py-3 transition hover:opacity-90 ${colors}`}
    >
      <p className="text-[11px] text-[var(--admin-text-secondary)]">{label}</p>
      <p className="admin-num mt-1 text-[1.25rem] font-semibold text-[var(--admin-text)]">
        {value}
      </p>
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Package;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-[8px] border border-[var(--admin-border)] px-3 py-2.5 text-[12px] text-[var(--admin-text-secondary)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
    >
      <Icon className="size-3.5" strokeWidth={1.6} />
      {label}
    </Link>
  );
}
