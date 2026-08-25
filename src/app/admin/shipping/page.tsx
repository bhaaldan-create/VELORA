import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import {
  AdminButton,
  EmptyState,
  PageHeader,
  Surface,
} from "@/components/admin/ui/primitives";
import { Truck } from "@/components/admin/ui/icons";
import { listShippingProviders } from "@/lib/admin/shipping-providers";
import { listStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SHIPPING_STATUSES = [
  "handed_to_courier",
  "in_transit",
  "out_for_delivery",
] as const;

export default async function AdminShippingPage() {
  const [providers, orders] = await Promise.all([
    Promise.resolve(listShippingProviders()),
    listStoredOrders({ take: 400 }),
  ]);

  const shipments = orders.filter((o) =>
    (SHIPPING_STATUSES as readonly string[]).includes(o.status),
  );

  return (
    <AdminShell active="shipping" title="الشحن والتوصيل">
      <div className="space-y-6">
        <PageHeader
          title="الشحن والتوصيل"
          description="إدارة الشحنات وشركات التوصيل — منفصل عن رقم طلب VELORA."
        />

        <section>
          <h2 className="mb-3 text-[13px] font-semibold text-[var(--admin-text)]">
            شركات التوصيل
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {providers.map((p) => (
              <Surface key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--admin-text)]">
                      {p.nameAr}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
                      {p.name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      p.active
                        ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
                        : "bg-[var(--admin-surface-soft)] text-[var(--admin-text-muted)]"
                    }`}
                  >
                    {p.active ? "نشط" : "متوقف"}
                  </span>
                </div>
                <ul className="mt-4 space-y-1.5 text-[12px] text-[var(--admin-text-secondary)]">
                  <li>
                    API:{" "}
                    {p.apiStatus === "connected" ? "متصل" : "غير متصل"}
                  </li>
                  <li>
                    Webhook:{" "}
                    {p.webhookStatus === "connected"
                      ? "متصل"
                      : "جاهز للربط"}
                  </li>
                </ul>
                {p.notes ? (
                  <p className="mt-3 text-[12px] leading-relaxed text-[var(--admin-text-muted)]">
                    {p.notes}
                  </p>
                ) : null}
                <AdminButton variant="secondary" size="sm" className="mt-4" disabled>
                  إدارة الاتصال
                </AdminButton>
              </Surface>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[var(--admin-text)]">
              شحنات نشطة
            </h2>
            <span className="admin-num text-[12px] text-[var(--admin-text-muted)]">
              {shipments.length}
            </span>
          </div>
          {shipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="لا توجد شحنات قيد التوصيل"
              description="عند تحويل الطلب إلى «تم التسليم لشركة التوصيل» أو «في الطريق» يظهر هنا."
            />
          ) : (
            <ul className="space-y-2.5">
              {shipments.map((o) => (
                <li key={o.orderId}>
                  <Surface>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/orders/${o.orderId}`}
                            className="admin-num text-[13px] font-semibold text-[var(--admin-plum)] hover:underline"
                            dir="ltr"
                          >
                            {o.orderId}
                          </Link>
                          <StatusBadge status={o.status} short />
                        </div>
                        <p className="mt-1.5 text-[14px] font-medium">
                          {o.order.fullName}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--admin-text-secondary)]">
                          {o.order.shippingCarrierLabel || "شركة الوسط"}
                          {o.trackingNumber
                            ? ` · ${o.trackingNumber}`
                            : " · بانتظار رقم التتبع"}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="admin-num text-[14px] font-semibold">
                          {formatPrice(
                            o.order.total ??
                              o.order.subtotal + (o.order.deliveryFee ?? 0),
                          )}
                        </p>
                        <a
                          href={`/track/${o.orderId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-[12px] text-[var(--admin-plum-soft)] hover:underline"
                        >
                          تتبع الشحنة
                        </a>
                      </div>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
