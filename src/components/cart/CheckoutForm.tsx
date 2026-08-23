"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useCheckoutUI } from "@/context/CheckoutUIContext";
import { formatIraqMobileLocal } from "@/lib/phone";
import { ui } from "@/constants/brand";
import {
  getPaymentMethod,
  isWaylPaymentMethod,
  type PaymentMethod,
  type PaymentMethodId,
} from "@/data/payments";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import {
  CheckoutProgress,
  type CheckoutProgressStep,
} from "@/components/checkout/CheckoutProgress";
import { CheckoutCountdown } from "@/components/checkout/CheckoutCountdown";
import { CheckoutProcessing } from "@/components/checkout/CheckoutProcessing";
import {
  CheckoutFlowCta,
  CheckoutStickyBar,
} from "@/components/checkout/CheckoutFlowCta";
import {
  CheckoutErrorState,
  CheckoutImmersiveShell,
  CheckoutSuccessExperience,
} from "@/components/checkout/CheckoutSuccessExperience";
import { CheckoutReviewStep } from "@/components/checkout/CheckoutReviewStep";
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
import { mapCheckoutErrorToArabic, mapWaylErrorToArabic } from "@/lib/wayl";
import { cn } from "@/lib/utils";

type FlowPhase = "steps" | "countdown" | "processing" | "success" | "error";

const stepHeaders: Record<
  CheckoutProgressStep,
  { eyebrow: string; title: string }
> = {
  details: { eyebrow: "الخطوة 01", title: "بيانات الشحن" },
  payment: { eyebrow: "الخطوة 02", title: "طريقة الدفع" },
  review: { eyebrow: "الخطوة 03", title: "مراجعة الطلب" },
};

export function CheckoutForm({
  paymentMethods,
  defaultPaymentMethod = "cod",
}: {
  paymentMethods?: PaymentMethod[];
  defaultPaymentMethod?: PaymentMethodId;
}) {
  const { items, subtotal, clearCart } = useCart();
  const { customer, loading: authLoading } = useCustomerAuth();
  const { setImmersive } = useCheckoutUI();
  const formRef = useRef<HTMLFormElement>(null);
  const finalizeRef = useRef(false);

  const [step, setStep] = useState<CheckoutProgressStep>("details");
  const [phase, setPhase] = useState<FlowPhase>("steps");
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
  const paymentMethodData = getPaymentMethod(paymentMethod);
  const immersive = phase !== "steps";

  useEffect(() => {
    setImmersive(immersive);
    return () => setImmersive(false);
  }, [immersive, setImmersive]);

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

  function restoreFromAccount() {
    if (!customer) return;
    setFullName(customer.fullName);
    setEmail(customer.email);
    setPhone(formatIraqMobileLocal(customer.phone));
    setAddress(customer.address);
    setEditingShipping(false);
    setError(null);
  }

  function validateShipping(): boolean {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      setError("أكملي بيانات الشحن قبل المتابعة.");
      if (usingAccount) setEditingShipping(true);
      return false;
    }

    if (
      showShippingForm &&
      formRef.current &&
      !formRef.current.reportValidity()
    ) {
      return false;
    }

    setError(null);
    return true;
  }

  function goToPayment() {
    if (!validateShipping()) return;
    setStep("payment");
  }

  function goToReview() {
    if (!validateShipping()) {
      setStep("details");
      return;
    }
    setError(null);
    setStep("review");
  }

  function openCountdown() {
    if (!validateShipping()) {
      setStep("details");
      return;
    }
    finalizeRef.current = false;
    setPhase("countdown");
  }

  function cancelCountdown() {
    finalizeRef.current = false;
    setPhase("steps");
    setStep("review");
  }

  const placeOrder = useCallback(async () => {
    if (finalizeRef.current) return;
    finalizeRef.current = true;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      finalizeRef.current = false;
      setError("أكملي بيانات الشحن قبل تأكيد الطلب.");
      setPhase("steps");
      setStep("details");
      return;
    }

    setPhase("processing");
    setError(null);

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
          finalizeRef.current = false;
          setPhase("steps");
          setStep("payment");
          setPaymentMethod("cod");
          setError(
            mapWaylErrorToArabic(
              linkJson.error ||
                "تم حفظ الطلب لكن تعذّر فتح صفحة الدفع. تواصلي معنا عبر واتساب.",
            ),
          );
          setNotice(
            `تم حفظ طلبكِ برقم ${createdOrderId}. يمكنكِ إتمامه بالدفع عند الاستلام أو عبر واتساب.`,
          );
          return;
        }

        clearCart();
        window.location.href = linkJson.paymentUrl;
        return;
      }

      setSelectedPaymentLabel(paymentMethodLabel);
      setOrderId(json.orderId ?? null);
      clearCart();
      setPhase("success");
    } catch (err) {
      finalizeRef.current = false;
      setPhase("error");
      setError(
        mapCheckoutErrorToArabic(
          err instanceof Error ? err.message : "تعذّر إرسال الطلب.",
        ),
      );
    }
  }, [
    address,
    customer?.id,
    deliveryFee,
    email,
    fullName,
    items,
    needsWayl,
    notes,
    paymentMethod,
    phone,
    subtotal,
    total,
    clearCart,
  ]);

  function retryAfterError() {
    setError(null);
    finalizeRef.current = false;
    setPhase("steps");
    setStep("review");
  }

  if (items.length === 0 && phase !== "success") {
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

  if (phase === "countdown") {
    return (
      <CheckoutCountdown onConfirm={placeOrder} onCancel={cancelCountdown} />
    );
  }

  if (phase === "processing") {
    return <CheckoutProcessing />;
  }

  if (phase === "success") {
    return (
      <CheckoutImmersiveShell>
        <CheckoutSuccessExperience
          orderId={orderId}
          notice={notice}
          paid={!needsWayl && paymentMethod === "cod"}
        />
      </CheckoutImmersiveShell>
    );
  }

  if (phase === "error") {
    return (
      <CheckoutImmersiveShell>
        <CheckoutErrorState onRetry={retryAfterError} message={error} />
      </CheckoutImmersiveShell>
    );
  }

  const header = stepHeaders[step];

  const flowCta =
    step === "details"
      ? (
          <CheckoutFlowCta
            action="to-payment"
            onClick={goToPayment}
            showTotal
            total={total}
          />
        )
      : step === "payment"
        ? (
            <CheckoutFlowCta action="to-review" onClick={goToReview} />
          )
        : (
            <CheckoutFlowCta
              action="confirm"
              onClick={openCountdown}
              showTotal
              total={total}
            />
          );

  const mobileFlowCta =
    step === "details"
      ? (
          <CheckoutFlowCta
            action="to-payment"
            onClick={goToPayment}
            variant="compact"
            showTotal
            total={total}
          />
        )
      : step === "payment"
        ? (
            <CheckoutFlowCta
              action="to-review"
              onClick={goToReview}
              variant="compact"
            />
          )
        : (
            <CheckoutFlowCta
              action="confirm"
              onClick={openCountdown}
              variant="compact"
              showTotal
              total={total}
            />
          );

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === "details") goToPayment();
    else if (step === "payment") goToReview();
    else openCountdown();
  };

  return (
    <div
      className={cn(
        "bg-[var(--ivory)] pb-[calc(10.5rem+env(safe-area-inset-bottom))] lg:pb-16",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <header className="border-b border-[var(--plum)]/8 pb-6 sm:pb-8">
          <p className="t1 font-medium tracking-[0.22em] text-[var(--muted)]">
            {header.eyebrow}
          </p>
          <h1 className="font-display mt-2 text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-tight text-[var(--plum)]">
            {header.title}
          </h1>
          <CheckoutProgress active={step} />
        </header>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form
            id="velora-checkout-form"
            ref={formRef}
            onSubmit={onFormSubmit}
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

            {step === "details" ? (
              <>
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
                      disabled={false}
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
                  disabled={false}
                  onChange={setNotes}
                />
              </>
            ) : null}

            {step === "payment" ? (
              <PremiumPaymentPicker
                  methods={methods}
                  value={paymentMethod}
                  disabled={false}
                onChange={(id) => {
                  setPaymentMethod(id);
                  setError(null);
                }}
              />
            ) : null}

            {step === "review" ? (
              <CheckoutReviewStep
                fullName={fullName}
                email={email}
                phone={phone}
                address={address}
                paymentMethod={paymentMethodData}
                items={items}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                total={total}
                onEditShipping={() => setStep("details")}
                onEditPayment={() => setStep("payment")}
                onConfirm={openCountdown}
                hideInlineConfirm
              />
            ) : null}

            {error ? (
              <div
                role="alert"
                className="rounded-[14px] border border-[var(--plum)]/15 bg-[var(--mist)] px-4 py-3 t3 text-[var(--plum)]"
              >
                {error}
              </div>
            ) : null}

            {notice ? (
              <div
                role="status"
                className="rounded-[14px] border border-[var(--plum)]/12 bg-[var(--surface)] px-4 py-3 t3 text-[var(--plum)]/90"
              >
                {notice}
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
            <div className="hidden lg:block">{flowCta}</div>
          </div>
        </div>
      </div>

      <CheckoutStickyBar>{mobileFlowCta}</CheckoutStickyBar>
    </div>
  );
}
