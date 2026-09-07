"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PaymentMethod, PaymentMethodId } from "@/data/payments";
import { IconCheck } from "@/components/checkout/CheckoutIcons";
import { IconSoftParcel } from "@/components/cart/CartIcons";
import "./checkout-wizard.css";

type Props = {
  methods: PaymentMethod[];
  value: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
  disabled?: boolean;
};

export function PremiumPaymentPicker({
  methods,
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <section
      className="checkout-wizard space-y-5"
      aria-labelledby="checkout-payment-heading"
    >
      <div className="cw-panel__head mb-0">
        <h2 id="checkout-payment-heading" className="cw-panel__title">
          طريقة الدفع
        </h2>
        <p className="cw-panel__sub">اختاري الطريقة المناسبة لإتمام طلبك</p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="طريقة الدفع">
        {methods.map((method) => (
          <PaymentOptionCard
            key={method.id}
            method={method}
            selected={value === method.id}
            disabled={disabled}
            onSelect={() => onChange(method.id)}
          />
        ))}
      </div>
    </section>
  );
}

function PaymentOptionCard({
  method,
  selected,
  disabled,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const isWayl = method.id === "wayl";
  const inputId = `payment-${method.id}`;

  return (
    <label
      htmlFor={inputId}
      className="cw-pay-card"
      data-selected={selected ? "true" : "false"}
      aria-disabled={disabled || undefined}
    >
      <input
        id={inputId}
        type="radio"
        name="paymentMethod"
        value={method.id}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
            selected
              ? isWayl
                ? "border-[#0F766E]/25 bg-[#0F766E]/[0.07]"
                : "border-[var(--plum)]/20 bg-[var(--plum)]/[0.06]"
              : "border-[var(--plum)]/8 bg-[var(--mist)]/45",
          )}
        >
          {isWayl ? (
            <Image
              src={method.logo}
              alt="Wayl"
              width={56}
              height={24}
              className={cn(
                "h-5 w-auto object-contain transition-opacity duration-200",
                selected ? "opacity-100" : "opacity-80",
              )}
            />
          ) : (
            <IconSoftParcel
              className={cn(
                "text-[var(--plum)] transition-colors duration-200",
                selected ? "opacity-100" : "opacity-70",
              )}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[1rem] font-medium leading-snug text-[var(--ink)]">
                {method.nameAr}
              </p>
              <p
                className="mt-0.5 text-[0.72rem] tracking-[0.05em] text-[var(--muted)]"
                dir="ltr"
              >
                {method.name}
              </p>
            </div>

            <span className="cw-pay-mark mt-0.5 shrink-0" aria-hidden>
              <IconCheck
                className={cn(
                  "transition-all duration-200",
                  selected ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
              />
            </span>
          </div>

          <p className="text-[0.88rem] leading-relaxed text-[var(--muted)]">
            {method.descriptionAr}
          </p>

          {selected ? (
            <p className="pt-1 text-[0.72rem] font-medium tracking-[0.06em] text-[var(--plum)]/80">
              طريقة الدفع المختارة
            </p>
          ) : null}
        </div>
      </div>
    </label>
  );
}
