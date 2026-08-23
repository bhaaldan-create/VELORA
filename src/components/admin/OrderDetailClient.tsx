"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WhatsAppReceiptActions } from "@/components/admin/WhatsAppReceiptActions";
import { OrderTimeline } from "@/components/admin/ui/OrderTimeline";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import {
  AdminButton,
  PageHeader,
  Surface,
} from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
import {
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Printer,
} from "@/components/admin/ui/icons";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";
import { getOrderReceiptPath } from "@/lib/whatsapp-receipt";
import { formatPrice } from "@/lib/utils";

export function OrderDetailClient({ order: initial }: { order: StoredOrder }) {
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [note, setNote] = useState(initial.adminNote || "");
  const [, startTransition] = useTransition();
  const toast = useAdminToast();
  const router = useRouter();

  const total =
    order.order.total ??
    order.order.subtotal + (order.order.deliveryFee ?? 0);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: StoredOrder;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.order) {
        throw new Error(data.error || "تعذّر التحديث.");
      }
      startTransition(() => setOrder(data.order!));
      return data.order;
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: OrderStatus) {
    try {
      const markReceiptSent = status === "preparing";
      await patch({
        orderId: order.orderId,
        status,
        markReceiptSent,
      });
      toast.success("تم تحديث الحالة", ORDER_STATUS_LABELS[status]);
      if (status === "preparing") {
        window.open(
          `${getOrderReceiptPath(order.orderId)}?send=1`,
          "_blank",
          "noopener,noreferrer",
        );
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التحديث");
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`تم نسخ ${label}`);
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  const waPhone = order.order.phone
    .replace(/\D/g, "")
    .replace(/^0/, "964");

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        title={order.orderId}
        description={`${order.order.fullName} · ${new Date(order.savedAt).toLocaleString("ar-IQ")}`}
        actions={
          <div className="hidden flex-wrap gap-2 lg:flex">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => copy(order.orderId, "رقم الطلب")}
            >
              <Copy className="size-3.5" />
              نسخ الرقم
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() =>
                window.open(
                  getOrderReceiptPath(order.orderId),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <Printer className="size-3.5" />
              الفاتورة
            </AdminButton>
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[var(--admin-plum)] px-3 text-[12px] font-medium text-white"
            >
              <MessageCircle className="size-3.5" />
              واتساب
            </a>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <Link
          href="/admin/orders"
          className="text-[12px] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
        >
          ← العودة للطلبات
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold text-[var(--admin-text)]">
              تغيير الحالة
            </h2>
            <select
              disabled={busy}
              value={order.status}
              onChange={(e) =>
                changeStatus(e.target.value as OrderStatus)
              }
              className="h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Surface>

          <Surface>
            <h2 className="mb-4 text-[13px] font-semibold text-[var(--admin-text)]">
              مسار الطلب
            </h2>
            <OrderTimeline
              status={order.status}
              savedAt={order.savedAt}
              updatedAt={order.updatedAt}
            />
          </Surface>

          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold text-[var(--admin-text)]">
              المنتجات
            </h2>
            <ul className="space-y-2.5">
              {order.order.items.map((item) => (
                <li
                  key={`${item.id}-${item.size || ""}`}
                  className="flex justify-between gap-3 text-[13px]"
                >
                  <span>
                    <span className="font-medium text-[var(--admin-text)]">
                      {item.nameAr}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[var(--admin-text-muted)]">
                      {item.name}
                      {item.size ? ` · ${item.size}` : ""} × {item.quantity}
                    </span>
                  </span>
                  <span className="admin-num shrink-0 font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-[var(--admin-border)] pt-3 text-[13px]">
              <div className="flex justify-between text-[var(--admin-text-secondary)]">
                <span>المجموع الفرعي</span>
                <span className="admin-num">
                  {formatPrice(order.order.subtotal)}
                </span>
              </div>
              {typeof order.order.deliveryFee === "number" ? (
                <div className="flex justify-between text-[var(--admin-text-secondary)]">
                  <span>
                    التوصيل
                    {order.order.shippingCarrierLabel
                      ? ` · ${order.order.shippingCarrierLabel}`
                      : ""}
                  </span>
                  <span className="admin-num">
                    {formatPrice(order.order.deliveryFee)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between pt-1 text-[15px] font-semibold text-[var(--admin-text)]">
                <span>الإجمالي</span>
                <span className="admin-num">{formatPrice(total)}</span>
              </div>
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold text-[var(--admin-text)]">
              العميلة
            </h2>
            <dl className="space-y-2.5 text-[13px]">
              <div>
                <dt className="text-[11px] text-[var(--admin-text-muted)]">
                  الاسم
                </dt>
                <dd className="font-medium">{order.order.fullName}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--admin-text-muted)]">
                  الهاتف
                </dt>
                <dd dir="ltr">
                  <a href={`tel:${order.order.phone}`} className="hover:underline">
                    {order.order.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--admin-text-muted)]">
                  البريد
                </dt>
                <dd dir="ltr">
                  <a
                    href={`mailto:${order.order.email}`}
                    className="hover:underline"
                  >
                    {order.order.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-[var(--admin-text-muted)]">
                  العنوان
                </dt>
                <dd>
                  {order.order.city ? `${order.order.city} — ` : ""}
                  {order.order.address}
                </dd>
              </div>
              {order.order.notes ? (
                <div>
                  <dt className="text-[11px] text-[var(--admin-text-muted)]">
                    ملاحظات العميلة
                  </dt>
                  <dd>{order.order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Surface>

          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold text-[var(--admin-text)]">
              الدفع والشحن
            </h2>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--admin-text-muted)]">طريقة الدفع</dt>
                <dd>{order.order.paymentMethodLabel}</dd>
              </div>
              {order.order.paymentStatus ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-text-muted)]">حالة الدفع</dt>
                  <dd>
                    {order.order.paymentStatus === "paid"
                      ? "مدفوع"
                      : order.order.paymentStatus === "pending"
                        ? "بانتظار التحقق"
                        : "غير مدفوع"}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--admin-text-muted)]">شركة التوصيل</dt>
                <dd>{order.order.shippingCarrierLabel || "شركة الوسط"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--admin-text-muted)]">رقم الطلب</dt>
                <dd className="admin-num" dir="ltr">
                  {order.orderId}
                </dd>
              </div>
              {order.trackingNumber ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-text-muted)]">رقم التتبع</dt>
                  <dd className="admin-num" dir="ltr">
                    {order.trackingNumber}
                    <button
                      type="button"
                      className="ms-2 text-[var(--admin-plum-soft)]"
                      onClick={() =>
                        copy(order.trackingNumber!, "رقم التتبع")
                      }
                    >
                      <Copy className="inline size-3.5" />
                    </button>
                  </dd>
                </div>
              ) : (
                <p className="text-[12px] text-[var(--admin-text-muted)]">
                  لم يُنشأ رقم تتبع بعد — سيظهر عند ربط شركة التوصيل.
                </p>
              )}
              <a
                href={`/track/${order.orderId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--admin-plum-soft)] hover:underline"
              >
                رابط تتبع العميلة
                <ExternalLink className="size-3" />
              </a>
            </dl>
          </Surface>

          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold text-[var(--admin-text)]">
              الوصل وواتساب
            </h2>
            <WhatsAppReceiptActions
              order={order}
              onSent={async () => {
                await patch({
                  orderId: order.orderId,
                  status: order.status,
                  markReceiptSent: true,
                });
              }}
            />
          </Surface>

          <Surface>
            <h2 className="mb-2 text-[13px] font-semibold text-[var(--admin-text)]">
              ملاحظة داخلية
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2 text-[13px] outline-none"
              placeholder="ملاحظة للفريق…"
            />
            <AdminButton
              size="sm"
              className="mt-2"
              disabled={busy || note.trim() === (order.adminNote || "").trim()}
              onClick={async () => {
                try {
                  await patch({
                    orderId: order.orderId,
                    status: order.status,
                    adminNote: note,
                  });
                  toast.success("تم حفظ الملاحظة");
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "تعذّر الحفظ",
                  );
                }
              }}
            >
              حفظ
            </AdminButton>
          </Surface>
        </div>
      </div>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-3 py-2.5 backdrop-blur-md lg:hidden pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[var(--admin-plum)] text-[13px] font-medium text-white"
          >
            <MessageCircle className="size-4" />
            واتساب
          </a>
          <select
            disabled={busy}
            value={order.status}
            onChange={(e) => changeStatus(e.target.value as OrderStatus)}
            className="h-10 flex-[1.2] rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-2 text-[12px]"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[8px] border border-[var(--admin-border)]"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="المزيد"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
        {moreOpen ? (
          <div className="mt-2 grid grid-cols-2 gap-2 admin-animate-in">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => copy(order.orderId, "رقم الطلب")}
            >
              نسخ الرقم
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() =>
                window.open(
                  getOrderReceiptPath(order.orderId),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              الفاتورة
            </AdminButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
