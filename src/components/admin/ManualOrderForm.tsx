"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminProduct } from "@/lib/admin-product-types";
import {
  ORDER_SOURCE_LABELS,
  type OrderSource,
} from "@/lib/order-email";
import type { StoredOrder } from "@/lib/order-types";
import { DELIVERY_FEE_IQD } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { AdminButton, Surface } from "@/components/admin/ui/primitives";
import { Plus, Search, X } from "@/components/admin/ui/icons";
import { useAdminToast } from "@/components/admin/ui/Toast";

type LineItem = {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  size?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (order: StoredOrder) => void;
};

const SOURCE_OPTIONS: OrderSource[] = ["instagram", "whatsapp", "website", "other"];

export function ManualOrderForm({ open, onClose, onCreated }: Props) {
  const toast = useAdminToast();
  const [source, setSource] = useState<OrderSource>("instagram");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "wayl">("cod");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "pending">(
    "unpaid",
  );
  const [deliveryFee, setDeliveryFee] = useState(String(DELIVERY_FEE_IQD));
  const [items, setItems] = useState<LineItem[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [results, setResults] = useState<AdminProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = productQuery.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q,
          page: "1",
          pageSize: "12",
          visibility: "active",
        });
        const res = await fetch(`/api/admin/products?${params}`, {
          signal: ac.signal,
        });
        const data = (await res.json()) as {
          ok?: boolean;
          products?: AdminProduct[];
        };
        if (!ac.signal.aborted) {
          setResults(data.ok && Array.isArray(data.products) ? data.products : []);
        }
      } catch {
        if (!ac.signal.aborted) setResults([]);
      } finally {
        if (!ac.signal.aborted) setSearching(false);
      }
    }, 280);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [productQuery, open]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const feeNum = Math.max(0, Number(deliveryFee) || 0);
  const total = subtotal + feeNum;

  function addProduct(p: AdminProduct) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          price: p.salePrice,
          quantity: 1,
          size: p.size || undefined,
        },
      ];
    });
    setProductQuery("");
    setResults([]);
  }

  function resetForm() {
    setSource("instagram");
    setFullName("");
    setPhone("");
    setAddress("");
    setCity("");
    setEmail("");
    setNotes("");
    setPaymentMethod("cod");
    setPaymentStatus("unpaid");
    setDeliveryFee(String(DELIVERY_FEE_IQD));
    setItems([]);
    setProductQuery("");
    setResults([]);
  }

  async function submit() {
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast.error("الاسم والهاتف والعنوان مطلوبة.");
      return;
    }
    if (!items.length) {
      toast.error("أضيفي منتجاً واحداً على الأقل.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          source,
          paymentMethod,
          paymentStatus,
          deliveryFee: feeNum,
          items,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        order?: StoredOrder;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.order) {
        throw new Error(data.error || "تعذّر إنشاء الطلب.");
      }
      toast.success("تم إنشاء الطلب", data.order.orderId);
      onCreated(data.order);
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إنشاء الطلب.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Surface className="admin-animate-in border-[var(--admin-plum)]/15">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.05rem] font-semibold text-[var(--admin-text)]">
            إضافة طلب يدوي
          </h2>
          <p className="mt-1 text-[12px] text-[var(--admin-text-secondary)]">
            لطلبات إنستغرام وواتساب التي تصل خارج الموقع.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
          aria-label="إغلاق"
        >
          <X className="size-4" strokeWidth={1.6} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[12px] text-[var(--admin-text-secondary)] sm:col-span-2">
          مصدر الطلب
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  source === s
                    ? "bg-[var(--admin-plum)] text-white"
                    : "border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] text-[var(--admin-text-secondary)]"
                }`}
              >
                {ORDER_SOURCE_LABELS[s]}
              </button>
            ))}
          </div>
        </label>

        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          الاسم الكامل *
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
            placeholder="اسم الزبونة"
          />
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          رقم الهاتف *
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
            placeholder="07XXXXXXXXX"
          />
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)] sm:col-span-2">
          العنوان *
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
            placeholder="المنطقة، الشارع، أقرب نقطة دالة"
          />
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          المدينة
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
            placeholder="بغداد"
          />
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          البريد (اختياري)
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
            placeholder="email@example.com"
          />
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          طريقة الدفع
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "cod" | "wayl")}
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none"
          >
            <option value="cod">الدفع عند الاستلام</option>
            <option value="wayl">الدفع الإلكتروني</option>
          </select>
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          حالة الدفع
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as "unpaid" | "paid" | "pending")
            }
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none"
          >
            <option value="unpaid">غير مدفوع</option>
            <option value="pending">بانتظار التحقق</option>
            <option value="paid">مدفوع</option>
          </select>
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)]">
          أجور التوصيل
          <input
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            inputMode="numeric"
            dir="ltr"
            className="mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
          />
        </label>
        <label className="block text-[12px] text-[var(--admin-text-secondary)] sm:col-span-2">
          ملاحظات
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
            placeholder="تفاصيل إضافية من المحادثة…"
          />
        </label>
      </div>

      <div className="mt-5 border-t border-[var(--admin-border)] pt-4">
        <p className="text-[13px] font-semibold text-[var(--admin-text)]">
          المنتجات
        </p>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-text-muted)]"
            strokeWidth={1.6}
          />
          <input
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="ابحثي باسم المنتج أو العلامة…"
            className="h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] pe-10 ps-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
          />
          {searching ? (
            <p className="mt-1.5 text-[11px] text-[var(--admin-text-muted)]">
              جاري البحث…
            </p>
          ) : null}
          {results.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-md)]">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start hover:bg-[var(--admin-surface-soft)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-[var(--admin-text)]">
                        {p.nameAr}
                      </span>
                      <span
                        className="block truncate text-[11px] text-[var(--admin-text-muted)]"
                        dir="ltr"
                      >
                        {p.brandName ? `${p.brandName} · ` : ""}
                        {p.name}
                      </span>
                    </span>
                    <span className="admin-num shrink-0 text-[12px] font-semibold text-[var(--admin-plum)]">
                      {formatPrice(p.salePrice)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {items.length ? (
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--admin-text)]">
                    {item.nameAr}
                  </p>
                  <p className="admin-num text-[11px] text-[var(--admin-text-muted)]">
                    {formatPrice(item.price)}
                    {item.size ? ` · ${item.size}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-md border border-[var(--admin-border)] text-[14px]"
                    onClick={() =>
                      setItems((prev) =>
                        prev
                          .map((i) =>
                            i.id === item.id
                              ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                              : i,
                          )
                          .filter((i) => i.quantity > 0),
                      )
                    }
                  >
                    −
                  </button>
                  <span className="admin-num w-6 text-center text-[13px]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-md border border-[var(--admin-border)] text-[14px]"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i,
                        ),
                      )
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-[11px] text-[var(--admin-danger)]"
                  onClick={() =>
                    setItems((prev) => prev.filter((i) => i.id !== item.id))
                  }
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[12px] text-[var(--admin-text-muted)]">
            لم تُضف منتجات بعد — ابحثي وأضيفي من القائمة.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
        <div className="text-[12px] text-[var(--admin-text-secondary)]">
          <p>
            المجموع:{" "}
            <span className="admin-num font-semibold text-[var(--admin-text)]">
              {formatPrice(subtotal)}
            </span>
          </p>
          <p>
            التوصيل:{" "}
            <span className="admin-num">{formatPrice(feeNum)}</span>
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[var(--admin-plum)]">
            الإجمالي:{" "}
            <span className="admin-num">{formatPrice(total)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="ghost" size="sm" onClick={onClose}>
            إلغاء
          </AdminButton>
          <AdminButton
            size="sm"
            disabled={submitting}
            onClick={() => void submit()}
          >
            <Plus className="size-3.5" strokeWidth={1.6} />
            {submitting ? "جاري الحفظ…" : "حفظ الطلب"}
          </AdminButton>
        </div>
      </div>
    </Surface>
  );
}
