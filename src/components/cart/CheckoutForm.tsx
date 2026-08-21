"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatIraqMobileLocal } from "@/lib/phone";
import { formatPrice } from "@/lib/utils";
import { ui } from "@/constants/brand";
import { getPaymentMethod, type PaymentMethodId } from "@/data/payments";
import {
  PaymentLogo,
  PaymentMethodPicker,
} from "@/components/payments/PaymentMethods";
import { SuperQiPaymentModal } from "@/components/payments/SuperQiPaymentModal";
import { SuperQiPaymentTeaser } from "@/components/payments/SuperQiPaymentTeaser";
import {
  isSuperQiPaymentMethod,
  SUPER_QI_ACCOUNT,
} from "@/lib/super-qi";
import {
  DELIVERY_FEE_IQD,
  getOrderTotal,
  WASEET_CARRIER,
} from "@/lib/shipping";
import { DeliveryFeeNotice } from "@/components/shipping/DeliveryFeeNotice";

export function CheckoutForm() {
  const { items, subtotal, clearCart } = useCart();
  const { customer, loading: authLoading } = useCustomerAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodId>("cod");
  const [selectedPaymentLabel, setSelectedPaymentLabel] = useState("");
  const [qiModalOpen, setQiModalOpen] = useState(false);
  const [transferReference, setTransferReference] = useState<string | null>(
    null,
  );

  /** عند تسجيل الدخول: نعرض بيانات الحساب ونفتح التعديل فقط عند الحاجة */
  const [editingShipping, setEditingShipping] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const needsSuperQi = isSuperQiPaymentMethod(paymentMethod);
  const deliveryFee = DELIVERY_FEE_IQD;
  const total = getOrderTotal(subtotal, deliveryFee);
  const usingAccount = Boolean(customer);
  const showShippingForm = !usingAccount || editingShipping;

  useEffect(() => {
    if (!customer) {
      setEditingShipping(false);
      return;
    }
    setFullName(customer.fullName);
    setEmail(customer.email);
    setPhone(formatIraqMobileLocal(customer.phone));
    setAddress(customer.address);
    // إن نقص العنوان نفتح التعديل تلقائياً
    setEditingShipping(!customer.address.trim());
  }, [customer]);

  if (items.length === 0 && !done) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display t6 font-semibold text-[var(--plum)]">
          {ui.nothingCheckout}
        </h1>
        <Link href="/shop" className="mt-8 inline-block">
          <Button>{ui.returnShop}</Button>
        </Link>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="t3 text-[var(--muted)]">جارٍ تجهيز بيانات الشحن…</p>
      </div>
    );
  }

  function restoreFromAccount() {
    if (!customer) return;
    setFullName(customer.fullName);
    setEmail(customer.email);
    setPhone(formatIraqMobileLocal(customer.phone));
    setAddress(customer.address);
    setEditingShipping(false);
    setError(null);
  }

  if (done) {
    const method = getPaymentMethod(paymentMethod);
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
          تم التأكيد
        </p>
        <h1 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
          {ui.thankYou}
        </h1>
        <p className="t4 mt-4 text-[var(--ink)]/70">
          تم استلام طلبكِ وحفظه لدى فريق VELORA.
        </p>
        {notice ? (
          <p className="t3 mt-4 border border-[var(--plum)]/20 bg-[var(--mist)] px-4 py-3 text-[var(--plum)]">
            {notice}
          </p>
        ) : null}
        {orderId ? (
          <p className="t3 mt-3 text-[var(--muted)]">
            رقم الطلب: <span dir="ltr">#{orderId}</span>
          </p>
        ) : null}
        {method ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <PaymentLogo method={method} />
            <p className="t3 text-[var(--muted)]">
              طريقة الدفع: {selectedPaymentLabel || method.nameAr}
            </p>
            {transferReference ? (
              <div className="t3 mt-1 space-y-1 text-[var(--muted)]">
                <p>
                  تحويل سوبر كي إلى{" "}
                  <span dir="ltr">{SUPER_QI_ACCOUNT.number}</span>
                </p>
                <p>
                  رقم العملية: <span dir="ltr">{transferReference}</span>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        <Link href="/shop" className="mt-10 inline-block">
          <Button>{ui.continueShopping}</Button>
        </Link>
      </div>
    );
  }

  async function placeOrder(opts?: { transferReference?: string }) {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      setError("أكملِ بيانات الشحن قبل تأكيد الطلب.");
      if (usingAccount) setEditingShipping(true);
      return;
    }

    setError(null);
    setSubmitting(true);

    const method = getPaymentMethod(paymentMethod);
    const paymentMethodLabel = method?.nameAr ?? paymentMethod;
    const transferRef =
      opts?.transferReference?.trim() || transferReference || undefined;

    if (needsSuperQi && !transferRef) {
      setError("افتحي نافذة التحويل إلى سوبر كي وأدخلي رقم العملية.");
      setSubmitting(false);
      setQiModalOpen(true);
      return;
    }

    const payload = {
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      notes: trimmedNotes || undefined,
      paymentMethod,
      paymentMethodLabel,
      paymentStatus: needsSuperQi ? "pending" : "unpaid",
      transferReference: transferRef,
      superQiAccount: needsSuperQi ? SUPER_QI_ACCOUNT.number : undefined,
      customerId: customer?.id,
      items: items.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        quantity,
        size: product.size,
      })),
      subtotal,
      deliveryFee,
      total,
      shippingCarrier: WASEET_CARRIER.id,
      shippingCarrierLabel: WASEET_CARRIER.nameAr,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        orderId?: string;
        error?: string;
        message?: string;
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "تعذّر إرسال الطلب.");
      }

      setSelectedPaymentLabel(paymentMethodLabel);
      if (transferRef) setTransferReference(transferRef);
      setOrderId(json.orderId ?? null);
      if (json.message) setNotice(json.message);
      setQiModalOpen(false);
      clearCart();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الطلب.");
    } finally {
      setSubmitting(false);
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsSuperQi) {
      if (!transferReference) {
        setQiModalOpen(true);
        setError("أكملي التحويل عبر نافذة سوبر كي أولاً.");
        return;
      }
      await placeOrder({ transferReference });
      return;
    }
    await placeOrder();
  };

  const method = getPaymentMethod(paymentMethod);

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:py-20">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div>
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            الدفع
          </p>
          <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
            {ui.shippingDetails}
          </h1>
        </div>

        <div className="space-y-6">
          {!customer ? (
            <div className="border border-[var(--plum)]/12 bg-[var(--mist)] px-4 py-3">
              <p className="t3 text-[var(--ink)]/80">
                لديكِ حساب؟{" "}
                <Link
                  href="/login?next=/checkout"
                  className="text-[var(--plum)] underline-offset-4 hover:underline"
                >
                  سجّلي الدخول
                </Link>{" "}
                أو{" "}
                <Link
                  href="/register?next=/checkout"
                  className="text-[var(--plum)] underline-offset-4 hover:underline"
                >
                  أنشئي حساباً
                </Link>{" "}
                لتُملأ بياناتكِ تلقائياً.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--plum)]/12 bg-[var(--mist)]/70 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="t1 font-medium tracking-[0.12em] text-[var(--muted)]">
                    بيانات الشحن
                  </p>
                  <p className="t3 mt-1 text-[var(--ink)]/80">
                    {editingShipping
                      ? "عدّلي لهذه الطلب فقط — حسابكِ يبقى كما هو."
                      : "مأخوذة مباشرة من حسابكِ."}
                  </p>
                </div>
                {editingShipping ? (
                  <button
                    type="button"
                    onClick={restoreFromAccount}
                    className="t2 text-[var(--plum)] underline-offset-4 hover:underline"
                  >
                    استعادة من الحساب
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingShipping(true)}
                    className="t2 text-[var(--plum)] underline-offset-4 hover:underline"
                  >
                    تعديل لهذه الطلب
                  </button>
                )}
              </div>

              {!editingShipping ? (
                <dl className="mt-5 space-y-3">
                  <ShippingRow label="الاسم" value={fullName} />
                  <ShippingRow label="البريد" value={email} ltr />
                  <ShippingRow label="الجوال" value={phone} ltr />
                  <ShippingRow label="العنوان" value={address || "—"} />
                </dl>
              ) : null}
            </div>
          )}

          {showShippingForm ? (
            <>
              <label className="block">
                <span className="t1 font-medium tracking-[0.1em] text-[var(--muted)]">
                  الاسم الكامل
                </span>
                <input
                  name="fullName"
                  required
                  disabled={submitting}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="t1 font-medium tracking-[0.1em] text-[var(--muted)]">
                  البريد الإلكتروني
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  disabled={submitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="t1 font-medium tracking-[0.1em] text-[var(--muted)]">
                  رقم الهاتف
                </span>
                <input
                  name="phone"
                  required
                  disabled={submitting}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXXX"
                  pattern="07[0-9]{9}"
                  title="رقم جوال عراقي: 07XXXXXXXXX"
                  dir="ltr"
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="t1 font-medium tracking-[0.1em] text-[var(--muted)]">
                  العنوان
                </span>
                <textarea
                  name="address"
                  required
                  rows={3}
                  disabled={submitting}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المحافظة، المنطقة، أقرب نقطة دالة…"
                  className="t3 mt-2 w-full border border-[var(--plum)]/15 bg-transparent px-3 py-3 outline-none focus:border-[var(--plum)]/40 disabled:opacity-60"
                />
              </label>
            </>
          ) : (
            <>
              <input type="hidden" name="fullName" value={fullName} />
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="phone" value={phone} />
              <input type="hidden" name="address" value={address} />
            </>
          )}

          <label className="block">
            <span className="t1 font-medium tracking-[0.1em] text-[var(--muted)]">
              ملاحظات (اختياري)
            </span>
            <textarea
              name="notes"
              rows={3}
              disabled={submitting}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="t3 mt-2 w-full border border-[var(--plum)]/15 bg-transparent px-3 py-3 outline-none focus:border-[var(--plum)]/40 disabled:opacity-60"
              placeholder="مثلاً: وقت التوصيل المفضّل"
            />
          </label>
        </div>

        <PaymentMethodPicker
          value={paymentMethod}
          onChange={(id) => {
            setPaymentMethod(id as PaymentMethodId);
            setTransferReference(null);
            setError(null);
            if (isSuperQiPaymentMethod(id)) {
              setQiModalOpen(true);
            } else {
              setQiModalOpen(false);
            }
          }}
        />

        {needsSuperQi ? (
          <SuperQiPaymentTeaser
            amountIqd={total}
            paymentLabelAr={method?.nameAr ?? "البطاقة"}
            transferReference={transferReference}
            onOpen={() => setQiModalOpen(true)}
          />
        ) : null}

        {paymentMethod === "zain-cash" ? (
          <div className="border border-[var(--plum)]/12 bg-[var(--mist)] px-4 py-4">
            <p className="t3 font-medium text-[var(--ink)]">زين كاش</p>
            <p className="t2 mt-2 text-[var(--muted)]">
              بعد تأكيد الطلب سيتواصل معكِ فريق VELORA لتأكيد تحويل زين كاش
              وإكمال التجهيز.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting
            ? "جارٍ إرسال الطلب…"
            : needsSuperQi && !transferReference
              ? "افتحي نافذة سوبر كي لإتمام الدفع"
              : `${ui.placeOrder} · ${formatPrice(total)}`}
        </Button>

        <p className="t2 text-[var(--muted)]">
          يُحفظ الطلب في{" "}
          <Link href="/admin/orders" className="underline underline-offset-4">
            صندوق الطلبات
          </Link>
          {needsSuperQi
            ? " مع رقم تحويل سوبر كي ليتحقّق الفريق من وصول المبلغ."
            : "."}
        </p>
      </form>

      <aside className="bg-[var(--mist)] p-8">
        <h2 className="font-display t6 font-medium text-[var(--plum)]">
          {ui.orderSummary}
        </h2>
        <ul className="mt-6 space-y-4">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="t3 flex justify-between gap-4">
              <span>
                {product.nameAr} × {quantity}
              </span>
              <span>{formatPrice(product.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3 border-t border-[var(--plum)]/15 pt-4">
          <div className="t3 flex justify-between gap-4 text-[var(--ink)]/80">
            <span>{ui.subtotal}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="t3 flex justify-between gap-4 text-[var(--plum)]">
            <span>أجور التوصيل</span>
            <span>+ {formatPrice(deliveryFee)}</span>
          </div>
          <DeliveryFeeNotice feeIqd={deliveryFee} />
        </div>
        {method ? (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--plum)]/15 pt-4">
            <span className="t2 text-[var(--muted)]">طريقة الدفع</span>
            <PaymentLogo method={method} compact />
          </div>
        ) : null}
        {needsSuperQi ? (
          <div className="mt-4 border border-[var(--plum)]/10 bg-white px-3 py-3">
            <p className="t2 text-[var(--muted)]">حساب سوبر كي</p>
            <p className="t3 mt-1 font-medium text-[var(--plum)]" dir="ltr">
              {SUPER_QI_ACCOUNT.number}
            </p>
          </div>
        ) : null}
        <div className="font-display t5 mt-6 flex justify-between border-t border-[var(--plum)]/15 pt-4 font-semibold text-[var(--plum)]">
          <span>{ui.total}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </aside>

      <SuperQiPaymentModal
        open={qiModalOpen}
        onClose={() => setQiModalOpen(false)}
        paymentMethod={paymentMethod}
        amountIqd={total}
        customerName={fullName}
        disabled={submitting}
        onConfirm={({ transferReference: ref }) => {
          setTransferReference(ref);
          void placeOrder({ transferReference: ref });
        }}
      />
    </div>
  );
}

function ShippingRow({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="t2 text-[var(--muted)]">{label}</dt>
      <dd
        className="t3 max-w-[70%] text-end text-[var(--ink)]"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
