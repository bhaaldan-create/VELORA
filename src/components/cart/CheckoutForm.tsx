"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatIraqMobileLocal } from "@/lib/phone";
import { formatPrice } from "@/lib/utils";
import { ui } from "@/constants/brand";
import {
  getPaymentMethod,
  isWaylPaymentMethod,
  type PaymentMethod,
  type PaymentMethodId,
} from "@/data/payments";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { IconSpinner } from "@/components/checkout/CheckoutIcons";
import { PremiumPaymentPicker } from "@/components/checkout/PremiumPaymentPicker";
import { ShippingAddressCard } from "@/components/checkout/ShippingAddressCard";
import {
  CheckoutNotesField,
  ShippingEditForm,
} from "@/components/checkout/ShippingEditForm";
import {
  DELIVERY_FEE_IQD,
  getOrderTotal,
  WASEET_CARRIER,
} from "@/lib/shipping";
import { cn } from "@/lib/utils";

export function CheckoutForm({
  paymentMethods,
  defaultPaymentMethod = "cod",
}: {
  paymentMethods?: PaymentMethod[];
  defaultPaymentMethod?: PaymentMethodId;
}) {
  const { items, subtotal, clearCart } = useCart();
  const { customer, loading: authLoading } = useCustomerAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodId>(defaultPaymentMethod);
  const [selectedPaymentLabel, setSelectedPaymentLabel] = useState("");

  const [editingShipping, setEditingShipping] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const methods = paymentMethods ?? [];
  const needsWayl = isWaylPaymentMethod(paymentMethod);
  const deliveryFee = DELIVERY_FEE_IQD;
  const total = getOrderTotal(subtotal, deliveryFee);
  const itemCount = items.reduce((sum, { quantity }) => sum + quantity, 0);
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

  async function placeOrder() {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      setError("أكملي بيانات الشحن قبل تأكيد الطلب.");
      if (usingAccount) setEditingShipping(true);
      return;
    }

    setError(null);
    setSubmitting(true);

    const method = getPaymentMethod(paymentMethod);
    const paymentMethodLabel = method?.nameAr ?? paymentMethod;

    const payload = {
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      notes: trimmedNotes || undefined,
      paymentMethod,
      paymentMethodLabel,
      paymentStatus: needsWayl ? "unpaid" : "unpaid",
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

      const createdOrderId = json.orderId ?? null;

      if (needsWayl && createdOrderId) {
        const linkRes = await fetch("/api/payments/wayl/create-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrderId }),
        });
        const linkJson = (await linkRes.json()) as {
          ok?: boolean;
          paymentUrl?: string;
          error?: string;
        };

        if (!linkRes.ok || !linkJson.ok || !linkJson.paymentUrl) {
          throw new Error(
            linkJson.error ||
              "تم حفظ الطلب لكن تعذّر فتح صفحة الدفع. تواصلي معنا عبر واتساب.",
          );
        }

        clearCart();
        window.location.href = linkJson.paymentUrl;
        return;
      }

      setSelectedPaymentLabel(paymentMethodLabel);
      setOrderId(json.orderId ?? null);
      if (json.message) setNotice(json.message);
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
    await placeOrder();
  };

  if (done) {
    const method = getPaymentMethod(paymentMethod);
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center sm:py-24">
        <p className="t1 font-medium tracking-[0.2em] text-[var(--muted)]">
          تم التأكيد
        </p>
        <h1 className="font-display mt-4 text-[2rem] font-medium text-[var(--plum)]">
          {ui.thankYou}
        </h1>
        <p className="t4 mt-4 text-[var(--ink)]/70">
          تم استلام طلبكِ وحفظه لدى فريق VELORA.
        </p>
        {notice ? (
          <p className="t3 mt-5 rounded-[14px] border border-[var(--plum)]/12 bg-[var(--surface)] px-4 py-3 text-[var(--plum)]">
            {notice}
          </p>
        ) : null}
        {orderId ? (
          <p className="t3 mt-4 text-[var(--muted)]">
            رقم الطلب: <span dir="ltr">#{orderId}</span>
          </p>
        ) : null}
        {method ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            {method.id === "wayl" ? (
              <Image
                src={method.logo}
                alt="Wayl"
                width={72}
                height={28}
                className="h-7 w-auto"
              />
            ) : null}
            <p className="t3 text-[var(--muted)]">
              طريقة الدفع: {selectedPaymentLabel || method.nameAr}
            </p>
          </div>
        ) : null}
        <Link href="/shop" className="mt-10 inline-block">
          <Button className="rounded-[14px] px-8">
            {ui.continueShopping}
          </Button>
        </Link>
      </div>
    );
  }

  const ctaLabel = submitting
    ? needsWayl
      ? "جارٍ التحويل إلى الدفع…"
      : "جارٍ تأكيد الطلب…"
    : needsWayl
      ? "الانتقال إلى الدفع"
      : "تأكيد الطلب";

  const submitButton = (
    <button
      type="submit"
      form="velora-checkout-form"
      disabled={submitting}
      className={cn(
        "t3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--plum)] px-6 py-3.5 font-medium text-[var(--ivory)] shadow-[0_6px_20px_-8px_rgba(61,38,64,0.45)] transition-all duration-200",
        "hover:bg-[var(--plum-soft)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55",
      )}
    >
      {submitting ? <IconSpinner /> : null}
      <span>{ctaLabel}</span>
      {!submitting ? (
        <span className="opacity-80">· {formatPrice(total)}</span>
      ) : null}
    </button>
  );

  return (
    <div className="bg-[var(--ivory)] pb-28 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <header className="border-b border-[var(--plum)]/8 pb-8">
          <p className="t1 font-medium tracking-[0.22em] text-[var(--muted)]">
            الدفع
          </p>
          <h1 className="font-display mt-2 text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-tight text-[var(--plum)]">
            بيانات الشحن
          </h1>
          <CheckoutProgress active="payment" />
        </header>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form
            id="velora-checkout-form"
            ref={formRef}
            onSubmit={onSubmit}
            className="min-w-0 space-y-8"
            noValidate={false}
          >
            {!customer ? (
              <div className="rounded-[16px] border border-[var(--plum)]/8 bg-[var(--surface)]/80 px-4 py-3.5">
                <p className="t3 text-[var(--ink)]/80">
                  لديكِ حساب؟{" "}
                  <Link
                    href="/login?next=/checkout"
                    className="font-medium text-[var(--plum)] underline-offset-4 hover:underline"
                  >
                    سجّلي الدخول
                  </Link>{" "}
                  أو{" "}
                  <Link
                    href="/register?next=/checkout"
                    className="font-medium text-[var(--plum)] underline-offset-4 hover:underline"
                  >
                    أنشئي حساباً
                  </Link>{" "}
                  لتُملأ بياناتكِ تلقائياً.
                </p>
              </div>
            ) : null}

            {usingAccount && !editingShipping ? (
              <ShippingAddressCard
                fullName={fullName}
                email={email}
                phone={phone}
                address={address}
                onEdit={() => setEditingShipping(true)}
              />
            ) : null}

            {showShippingForm ? (
              <div
                className={cn(
                  usingAccount &&
                    "rounded-[20px] border border-[var(--plum)]/8 bg-[var(--surface)] p-5 sm:p-6",
                )}
              >
                {usingAccount ? (
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--plum)]/8 pb-4">
                    <p className="t3 text-[var(--muted)]">
                      عدّلي بيانات التوصيل لهذا الطلب
                    </p>
                    <button
                      type="button"
                      onClick={restoreFromAccount}
                      className="t2 shrink-0 font-medium text-[var(--plum)] underline-offset-4 hover:underline"
                    >
                      استعادة من الحساب
                    </button>
                  </div>
                ) : null}
                <ShippingEditForm
                  fullName={fullName}
                  email={email}
                  phone={phone}
                  address={address}
                  disabled={submitting}
                  onFullNameChange={setFullName}
                  onEmailChange={setEmail}
                  onPhoneChange={setPhone}
                  onAddressChange={setAddress}
                  showHeading={!usingAccount}
                />
              </div>
            ) : (
              <>
                <input type="hidden" name="fullName" value={fullName} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="address" value={address} />
              </>
            )}

            <CheckoutNotesField
              value={notes}
              disabled={submitting}
              onChange={setNotes}
            />

            <PremiumPaymentPicker
              methods={methods}
              value={paymentMethod}
              disabled={submitting}
              onChange={(id) => {
                setPaymentMethod(id);
                setError(null);
              }}
            />

            {error ? (
              <div
                role="alert"
                className="rounded-[14px] border border-red-200/80 bg-red-50/90 px-4 py-3 t3 text-red-800"
              >
                {error}
              </div>
            ) : null}
          </form>

          <div className="space-y-6 lg:sticky lg:top-24">
            <CheckoutOrderSummary
              itemCount={itemCount}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
            />
            <div className="hidden lg:block">{submitButton}</div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--plum)]/8 bg-[var(--ivory)]/95 px-4 py-3 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-6xl">{submitButton}</div>
      </div>
    </div>
  );
}
