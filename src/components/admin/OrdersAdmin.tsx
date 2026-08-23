"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { WhatsAppReceiptActions } from "@/components/admin/WhatsAppReceiptActions";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import {
  AdminButton,
  EmptyState,
  PageHeader,
  Surface,
} from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
import {
  Copy,
  Filter,
  MessageCircle,
  Search,
  ShoppingBag,
} from "@/components/admin/ui/icons";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SHORT,
  ORDER_STATUSES,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";
import { getOrderReceiptPath } from "@/lib/whatsapp-receipt";
import { formatPrice } from "@/lib/utils";

type Counts = Record<"all" | OrderStatus, number>;

type Props = {
  initialOrders: StoredOrder[];
  initialCounts: Counts;
};

function orderTotal(entry: StoredOrder) {
  return (
    entry.order.total ??
    entry.order.subtotal + (entry.order.deliveryFee ?? 0)
  );
}

const QUICK_FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "new", label: "جديد" },
  { id: "preparing", label: "تجهيز" },
  { id: "handed_to_courier", label: "مع التوصيل" },
  { id: "in_transit", label: "في الطريق" },
  { id: "delivered", label: "مسلّم" },
  { id: "cancelled", label: "ملغي" },
];

export function OrdersAdmin({ initialOrders, initialCounts }: Props) {
  const searchParams = useSearchParams();
  const toast = useAdminToast();
  const [orders, setOrders] = useState(initialOrders);
  const [counts, setCounts] = useState(initialCounts);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const s = searchParams.get("status");
    if (s && (s === "all" || ORDER_STATUSES.includes(s as OrderStatus))) {
      setStatusFilter(s as OrderStatus | "all");
    }
    const qParam = searchParams.get("q");
    if (qParam) setQuery(qParam);
  }, [searchParams]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return orders.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (paymentFilter === "paid" && entry.order.paymentStatus !== "paid") {
        return false;
      }
      if (
        paymentFilter === "pending" &&
        entry.order.paymentStatus !== "pending" &&
        entry.order.paymentStatus !== "unpaid"
      ) {
        return false;
      }
      if (
        paymentFilter === "cod" &&
        !entry.order.paymentMethodLabel?.includes("استلام")
      ) {
        return false;
      }
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
        entry.trackingNumber || "",
        entry.adminNote || "",
        ...entry.order.items.map((i) => `${i.nameAr} ${i.name}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, statusFilter, deferredQuery, paymentFilter]);

  function recalculateCounts(list: StoredOrder[]): Counts {
    const next = { all: list.length } as Counts;
    for (const s of ORDER_STATUSES) next[s] = 0;
    for (const o of list) next[o.status] += 1;
    return next;
  }

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
          setCounts(recalculateCounts(next));
          return next;
        });
      });
      toast.success("تم تحديث الطلب", ORDER_STATUS_LABELS[status]);

      if (status === "preparing") {
        window.open(
          `${getOrderReceiptPath(orderId)}?send=1`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر تحديث الحالة.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  }

  async function saveNote(orderId: string, adminNote: string) {
    const current = orders.find((o) => o.orderId === orderId);
    if (!current) return;
    setPendingId(orderId);
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
      toast.success("تم حفظ الملاحظة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر حفظ الملاحظة.");
    } finally {
      setPendingId(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkStatus(status: OrderStatus) {
    const ids = [...selected];
    for (const id of ids) {
      await changeStatus(id, status);
    }
    setSelected(new Set());
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`تم نسخ ${label}`);
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="الطلبات"
        description="مساحة عمل لإدارة الطلبات، الحالات، والتوصيل."
        actions={
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="size-3.5" strokeWidth={1.6} />
            فلاتر
          </AdminButton>
        }
      />

      <div className="flex gap-2 overflow-x-auto admin-scroll pb-1">
        {QUICK_FILTERS.map((f) => {
          const count =
            f.id === "all" ? counts.all : (counts[f.id] ?? 0);
          const active = statusFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "bg-[var(--admin-plum)] text-white"
                  : "border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)]"
              }`}
            >
              {f.label}
              <span className="admin-num ms-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-text-muted)]"
          strokeWidth={1.6}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="رقم الطلب، الاسم، الهاتف، التتبع…"
          className="h-11 w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] pe-10 ps-3.5 text-[14px] text-[var(--admin-text)] outline-none transition focus:border-[var(--admin-plum-soft)]"
        />
      </div>

      {showFilters ? (
        <Surface className="admin-animate-in">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-[12px] text-[var(--admin-text-secondary)]">
              الحالة التفصيلية
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as OrderStatus | "all")
                }
                className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none"
              >
                <option value="all">الكل</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-[var(--admin-text-secondary)]">
              الدفع
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none"
              >
                <option value="all">الكل</option>
                <option value="cod">الدفع عند الاستلام</option>
                <option value="paid">مدفوع</option>
                <option value="pending">بانتظار الدفع</option>
              </select>
            </label>
            <div className="flex items-end">
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setPaymentFilter("all");
                  setQuery("");
                }}
              >
                مسح الفلاتر
              </AdminButton>
            </div>
          </div>
        </Surface>
      ) : null}

      {error ? (
        <div className="rounded-[8px] border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-bg)] px-4 py-3 text-[13px] text-[var(--admin-danger)]">
          {error}
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="sticky top-[calc(var(--admin-topbar-h)+0.5rem)] z-20 flex flex-wrap items-center gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-plum)]/20 bg-[var(--admin-surface)] px-3 py-2.5 shadow-[var(--admin-shadow-md)]">
          <span className="text-[12px] font-medium text-[var(--admin-text)]">
            {selected.size} محدد
          </span>
          <AdminButton
            size="sm"
            variant="secondary"
            onClick={() => bulkStatus("preparing")}
          >
            تجهيز
          </AdminButton>
          <AdminButton
            size="sm"
            variant="secondary"
            onClick={() => bulkStatus("delivered")}
          >
            تم التسليم
          </AdminButton>
          <AdminButton
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            إلغاء
          </AdminButton>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="لا توجد طلبات حالياً"
          description="عندما يصل طلب جديد سيظهر هنا. جرّبي تغيير الفلتر أو مسح البحث."
        />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((entry) => {
            const busy = pendingId === entry.orderId || isPending;
            const checked = selected.has(entry.orderId);
            const itemsCount = entry.order.items.reduce(
              (n, i) => n + i.quantity,
              0,
            );
            return (
              <li key={entry.orderId}>
                <Surface padded={false} className="overflow-hidden">
                  <div className="flex items-stretch gap-0">
                    <label className="flex items-center border-e border-[var(--admin-border)] px-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(entry.orderId)}
                        className="size-4 accent-[var(--admin-plum)]"
                        aria-label={`تحديد ${entry.orderId}`}
                      />
                    </label>
                    <div className="min-w-0 flex-1 p-3.5 sm:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/orders/${entry.orderId}`}
                              className="admin-num text-[13px] font-semibold text-[var(--admin-plum)] hover:underline"
                              dir="ltr"
                            >
                              {entry.orderId}
                            </Link>
                            <StatusBadge status={entry.status} short />
                            <button
                              type="button"
                              className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                              aria-label="نسخ رقم الطلب"
                              onClick={() =>
                                copyText(entry.orderId, "رقم الطلب")
                              }
                            >
                              <Copy className="size-3.5" strokeWidth={1.6} />
                            </button>
                          </div>
                          <h2 className="mt-1.5 text-[15px] font-semibold text-[var(--admin-text)]">
                            {entry.order.fullName}
                          </h2>
                          <p className="mt-1 text-[12px] text-[var(--admin-text-secondary)]">
                            <a
                              href={`tel:${entry.order.phone}`}
                              className="hover:underline"
                              dir="ltr"
                            >
                              {entry.order.phone}
                            </a>
                            {entry.order.city ? ` · ${entry.order.city}` : ""}
                            {entry.order.address
                              ? ` · ${entry.order.address.slice(0, 40)}${entry.order.address.length > 40 ? "…" : ""}`
                              : ""}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="admin-num text-[15px] font-semibold text-[var(--admin-text)]">
                            {formatPrice(orderTotal(entry))}
                          </p>
                          <p
                            className="mt-1 text-[11px] text-[var(--admin-text-muted)]"
                            dir="ltr"
                          >
                            {new Date(entry.savedAt).toLocaleString("ar-IQ", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--admin-text-secondary)]">
                        <span>{itemsCount} منتجات</span>
                        <span>{entry.order.paymentMethodLabel}</span>
                        {entry.order.paymentStatus ? (
                          <span>
                            {entry.order.paymentStatus === "paid"
                              ? "مدفوع"
                              : entry.order.paymentStatus === "pending"
                                ? "بانتظار الدفع"
                                : "غير مدفوع"}
                          </span>
                        ) : null}
                        <span>
                          {entry.order.shippingCarrierLabel || "شركة الوسط"}
                        </span>
                        {entry.trackingNumber ? (
                          <span className="admin-num" dir="ltr">
                            {entry.trackingNumber}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] pt-3">
                        <Link
                          href={`/admin/orders/${entry.orderId}`}
                          className="inline-flex h-8 items-center rounded-[8px] bg-[var(--admin-plum)] px-3 text-[12px] font-medium text-white"
                        >
                          التفاصيل
                        </Link>
                        <select
                          disabled={busy}
                          value={entry.status}
                          onChange={(e) =>
                            changeStatus(
                              entry.orderId,
                              e.target.value as OrderStatus,
                            )
                          }
                          className="h-8 rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-2 text-[12px] outline-none disabled:opacity-40"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {ORDER_STATUS_SHORT[s]}
                            </option>
                          ))}
                        </select>
                        <a
                          href={
                            entry.order.phone
                              ? `https://wa.me/${entry.order.phone.replace(/\D/g, "").replace(/^0/, "964")}`
                              : "#"
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[var(--admin-border)] px-2.5 text-[12px] text-[var(--admin-text-secondary)]"
                        >
                          <MessageCircle
                            className="size-3.5"
                            strokeWidth={1.6}
                          />
                          واتساب
                        </a>
                        <div className="ms-auto hidden sm:block">
                          <WhatsAppReceiptActions
                            order={entry}
                            compact
                            onSent={() => {
                              void fetch("/api/admin/orders", {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  orderId: entry.orderId,
                                  status: entry.status,
                                  markReceiptSent: true,
                                }),
                              }).then(async (res) => {
                                const data = (await res.json()) as {
                                  ok?: boolean;
                                  order?: StoredOrder;
                                };
                                if (data.ok && data.order) {
                                  setOrders((prev) =>
                                    prev.map((o) =>
                                      o.orderId === entry.orderId
                                        ? data.order!
                                        : o,
                                    ),
                                  );
                                }
                              });
                            }}
                          />
                        </div>
                      </div>

                      <details className="mt-2 sm:hidden">
                        <summary className="cursor-pointer text-[12px] text-[var(--admin-plum-soft)]">
                          وصل واتساب
                        </summary>
                        <div className="mt-2">
                          <WhatsAppReceiptActions order={entry} compact />
                        </div>
                      </details>

                      <details className="mt-1">
                        <summary className="cursor-pointer text-[12px] text-[var(--admin-text-muted)]">
                          ملاحظة داخلية
                        </summary>
                        <AdminNoteForm
                          key={`${entry.orderId}-${entry.adminNote || ""}`}
                          initial={entry.adminNote || ""}
                          disabled={busy}
                          onSave={(note) => saveNote(entry.orderId, note)}
                        />
                      </details>
                    </div>
                  </div>
                </Surface>
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
    <div className="mt-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
        placeholder="ملاحظة داخلية…"
      />
      <AdminButton
        size="sm"
        className="mt-2"
        disabled={disabled || note.trim() === initial.trim()}
        onClick={() => onSave(note)}
      >
        حفظ
      </AdminButton>
    </div>
  );
}
