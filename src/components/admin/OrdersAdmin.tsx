"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";
import { getOrderReceiptPath } from "@/lib/whatsapp-receipt";
import { WhatsAppReceiptActions } from "@/components/admin/WhatsAppReceiptActions";

type Counts = {
  all: number;
  new: number;
  preparing: number;
  delivered: number;
};

type Props = {
  initialOrders: StoredOrder[];
  initialCounts: Counts;
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-[#3D2640] text-[#F8F4F1]",
  preparing: "bg-[#D4B5B8] text-[#1A121C]",
  delivered: "bg-[#E9DFD6] text-[#3D2640]",
};

export function OrdersAdmin({ initialOrders, initialCounts }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [counts, setCounts] = useState(initialCounts);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialOrders[0]?.orderId ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return orders.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        entry.orderId,
        entry.order.fullName,
        entry.order.phone,
        entry.order.email,
        entry.order.city,
        entry.order.address,
        entry.order.paymentMethodLabel,
        entry.order.transferReference,
        entry.order.superQiAccount,
        entry.adminNote || "",
        ...entry.order.items.map((i) => `${i.nameAr} ${i.name}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, statusFilter, deferredQuery]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setError(null);
    setPendingId(orderId);
    try {
      const markReceiptSent = status === "preparing";
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, markReceiptSent }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: StoredOrder;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.order) {
        throw new Error(data.error || "تعذّر تحديث الحالة.");
      }

      const updated = data.order;

      startTransition(() => {
        setOrders((prev) => {
          const next = prev.map((o) =>
            o.orderId === orderId ? updated : o,
          );
          setCounts({
            all: next.length,
            new: next.filter((o) => o.status === "new").length,
            preparing: next.filter((o) => o.status === "preparing").length,
            delivered: next.filter((o) => o.status === "delivered").length,
          });
          return next;
        });
      });

      // عند «قيد التجهيز»: صفحة الوصل تحمّل صورة PNG وتفتح واتساب برسالة لطيفة
      if (status === "preparing") {
        window.open(
          `${getOrderReceiptPath(orderId)}?send=1`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحديث الحالة.");
    } finally {
      setPendingId(null);
    }
  }

  async function markReceiptSent(order: StoredOrder) {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          status: order.status,
          markReceiptSent: true,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: StoredOrder;
      };
      if (data.ok && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === order.orderId ? data.order! : o)),
        );
      }
    } catch {
      // غير حرج
    }
  }

  async function saveNote(orderId: string, adminNote: string) {
    const current = orders.find((o) => o.orderId === orderId);
    if (!current) return;
    setPendingId(orderId);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: current.status,
          adminNote,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: StoredOrder;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.order) {
        throw new Error(data.error || "تعذّر حفظ الملاحظة.");
      }
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? data.order! : o)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حفظ الملاحظة.");
    } finally {
      setPendingId(null);
    }
  }

  const filters: { id: OrderStatus | "all"; label: string; count: number }[] = [
    { id: "all", label: "الكل", count: counts.all },
    { id: "new", label: ORDER_STATUS_LABELS.new, count: counts.new },
    {
      id: "preparing",
      label: ORDER_STATUS_LABELS.preparing,
      count: counts.preparing,
    },
    {
      id: "delivered",
      label: ORDER_STATUS_LABELS.delivered,
      count: counts.delivered,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-4">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`border px-4 py-4 text-right transition ${
              statusFilter === f.id
                ? "border-[var(--plum)] bg-[var(--plum)] text-[var(--ivory)]"
                : "border-[var(--plum)]/15 bg-white text-[var(--plum)] hover:border-[var(--plum)]/40"
            }`}
          >
            <div className="t2 opacity-80">{f.label}</div>
            <div className="font-display t6 mt-1 font-medium">{f.count}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="t2 text-[var(--muted)]" htmlFor="admin-search">
          بحث في الطلبات
        </label>
        <input
          id="admin-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="رقم الطلب، الاسم، الهاتف، العنوان…"
          className="t4 mt-2 w-full border border-[var(--plum)]/20 bg-white px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--plum)]"
        />
      </div>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="border border-[var(--plum)]/15 bg-[var(--mist)] px-6 py-16 text-center">
          <p className="t4 text-[var(--plum)]">لا توجد طلبات مطابقة</p>
          <p className="t3 mt-2 text-[var(--muted)]">
            غيّري الفلتر أو امسحي البحث لعرض كل الطلبات.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((entry) => {
            const open = expandedId === entry.orderId;
            const busy = pendingId === entry.orderId || isPending;
            return (
              <li
                key={entry.orderId}
                className="border border-[var(--plum)]/12 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-right"
                  onClick={() =>
                    setExpandedId(open ? null : entry.orderId)
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`t1 px-2 py-1 ${STATUS_STYLES[entry.status]}`}
                      >
                        {ORDER_STATUS_LABELS[entry.status]}
                      </span>
                      <span className="t2 text-[var(--muted)]" dir="ltr">
                        #{entry.orderId}
                      </span>
                    </div>
                    <h2 className="font-display t5 mt-2 font-medium text-[var(--plum)]">
                      {entry.order.fullName}
                    </h2>
                    <p className="t3 mt-1 text-[var(--muted)]">
                      {entry.order.paymentMethodLabel} ·{" "}
                      {formatPrice(
                        entry.order.total ??
                          entry.order.subtotal +
                            (entry.order.deliveryFee ?? 0),
                      )}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="t2 text-[var(--muted)]" dir="ltr">
                      {new Date(entry.savedAt).toLocaleString("ar-IQ")}
                    </p>
                    <p className="t2 mt-2 text-[var(--plum)]">
                      {open ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                    </p>
                  </div>
                </button>

                {open ? (
                  <div className="border-t border-[var(--plum)]/10 px-5 py-5">
                    <dl className="grid gap-3 t3 sm:grid-cols-2">
                      <div>
                        <dt className="text-[var(--muted)]">الهاتف</dt>
                        <dd dir="ltr">
                          <a
                            href={`tel:${entry.order.phone}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {entry.order.phone}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">البريد</dt>
                        <dd dir="ltr">
                          <a
                            href={`mailto:${entry.order.email}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {entry.order.email}
                          </a>
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[var(--muted)]">العنوان</dt>
                        <dd>{entry.order.address}</dd>
                      </div>
                      {entry.order.paymentStatus ? (
                        <div>
                          <dt className="text-[var(--muted)]">حالة الدفع</dt>
                          <dd>
                            {entry.order.paymentStatus === "pending"
                              ? "بانتظار التحقق من سوبر كي"
                              : entry.order.paymentStatus === "paid"
                                ? "مدفوع"
                                : "غير مدفوع"}
                          </dd>
                        </div>
                      ) : null}
                      {entry.order.superQiAccount ? (
                        <div>
                          <dt className="text-[var(--muted)]">حساب سوبر كي</dt>
                          <dd dir="ltr">{entry.order.superQiAccount}</dd>
                        </div>
                      ) : null}
                      {entry.order.transferReference ? (
                        <div>
                          <dt className="text-[var(--muted)]">رقم التحويل</dt>
                          <dd dir="ltr" className="font-medium text-[var(--plum)]">
                            {entry.order.transferReference}
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-[var(--muted)]">التوصيل</dt>
                        <dd>
                          {entry.order.shippingCarrierLabel || "شركة الوسط"}
                          {typeof entry.order.deliveryFee === "number"
                            ? ` · ${formatPrice(entry.order.deliveryFee)}`
                            : ""}
                        </dd>
                      </div>
                      {entry.order.notes ? (
                        <div className="sm:col-span-2">
                          <dt className="text-[var(--muted)]">ملاحظات العميلة</dt>
                          <dd>{entry.order.notes}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <ul className="mt-5 space-y-2 border-t border-[var(--plum)]/10 pt-4">
                      {entry.order.items.map((item) => (
                        <li
                          key={`${entry.orderId}-${item.id}-${item.size || ""}`}
                          className="t3 flex justify-between gap-4"
                        >
                          <span>
                            {item.nameAr}
                            <span className="text-[var(--muted)]">
                              {" "}
                              × {item.quantity}
                              {item.size ? ` · ${item.size}` : ""}
                            </span>
                          </span>
                          <span>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                      {typeof entry.order.deliveryFee === "number" ? (
                        <li className="t3 flex justify-between gap-4 text-[var(--plum)]">
                          <span>
                            أجور التوصيل
                            {entry.order.shippingCarrierLabel
                              ? ` · ${entry.order.shippingCarrierLabel}`
                              : ""}
                            <span className="text-[var(--muted)]">
                              {" "}
                              (تم إضافتها)
                            </span>
                          </span>
                          <span>{formatPrice(entry.order.deliveryFee)}</span>
                        </li>
                      ) : null}
                      <li className="t4 flex justify-between gap-4 border-t border-[var(--plum)]/15 pt-3 font-medium text-[var(--plum)]">
                        <span>الإجمالي</span>
                        <span>
                          {formatPrice(
                            entry.order.total ??
                              entry.order.subtotal +
                                (entry.order.deliveryFee ?? 0),
                          )}
                        </span>
                      </li>
                    </ul>

                    <div className="mt-5">
                      <p className="t2 text-[var(--muted)]">تغيير الحالة</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ORDER_STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={busy || entry.status === status}
                            onClick={() => changeStatus(entry.orderId, status)}
                            className={`t2 px-3 py-2 transition disabled:opacity-40 ${
                              entry.status === status
                                ? STATUS_STYLES[status]
                                : "border border-[var(--plum)]/20 bg-[var(--mist)] text-[var(--plum)] hover:border-[var(--plum)]/50"
                            }`}
                          >
                            {status === "preparing"
                              ? "قيد التجهيز + وصل واتساب"
                              : ORDER_STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                      <p className="t2 mt-2 text-[var(--muted)]">
                        عند اختيار «قيد التجهيز» تُحمَّل صورة الوصل المملوءة
                        وتُفتح واتساب برسالة لطيفة قصيرة لإرفاق الصورة.
                      </p>
                    </div>

                    <div className="mt-5 border-t border-[var(--plum)]/10 pt-4">
                      <p className="t2 text-[var(--muted)]">الوصل والتتبع</p>
                      <div className="mt-2">
                        <WhatsAppReceiptActions
                          order={entry}
                          compact
                          onSent={() => markReceiptSent(entry)}
                        />
                      </div>
                      {entry.receiptSentAt ? (
                        <p className="t2 mt-2 text-[var(--muted)]" dir="ltr">
                          آخر إرسال وصل:{" "}
                          {new Date(entry.receiptSentAt).toLocaleString("ar-IQ")}
                        </p>
                      ) : null}
                      <a
                        href={`/track/${entry.orderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="t2 mt-2 inline-block text-[var(--plum)] underline-offset-4 hover:underline"
                      >
                        رابط تتبع العميلة
                      </a>
                    </div>

                    <AdminNoteForm
                      key={`${entry.orderId}-${entry.adminNote || ""}`}
                      initial={entry.adminNote || ""}
                      disabled={busy}
                      onSave={(note) => saveNote(entry.orderId, note)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AdminNoteForm({
  initial,
  disabled,
  onSave,
}: {
  initial: string;
  disabled: boolean;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initial);

  return (
    <div className="mt-5">
      <label className="t2 text-[var(--muted)]" htmlFor="admin-note">
        ملاحظة داخلية للإدارة
      </label>
      <textarea
        id="admin-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="t3 mt-2 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]"
        placeholder="مثال: تم التواصل مع العميلة / التوصيل غداً"
      />
      <button
        type="button"
        disabled={disabled || note.trim() === initial.trim()}
        onClick={() => onSave(note)}
        className="t2 mt-2 border border-[var(--plum)] bg-[var(--plum)] px-4 py-2 text-[var(--ivory)] disabled:opacity-40"
      >
        حفظ الملاحظة
      </button>
    </div>
  );
}
