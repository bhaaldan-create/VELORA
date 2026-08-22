"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PaymentMethod, PaymentMethodId } from "@/data/payments";
import { IconCheck, IconPackageCheck } from "@/components/checkout/CheckoutIcons";

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
    <section className="space-y-5" aria-labelledby="checkout-payment-heading">
      <div>
        <h2
          id="checkout-payment-heading"
          className="font-display text-[1.35rem] font-medium text-[var(--plum)] sm:text-[1.5rem]"
        >
          طريقة الدفع
        </h2>
        <p className="t3 mt-1.5 text-[var(--muted)]">
          اختاري الطريقة المناسبة لإتمام طلبك
        </p>
      </div>

      <div
        className="space-y-3"
        role="radiogroup"
        aria-label="طريقة الدفع"
      >
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
      className={cn(
        "group relative block cursor-pointer rounded-[18px] border bg-[var(--surface)] p-4 transition-all duration-200 sm:p-5",
        selected
          ? "border-[var(--plum)] bg-[var(--plum)]/[0.03] shadow-[0_8px_28px_-12px_rgba(61,38,64,0.22)]"
          : "border-[var(--plum)]/10 shadow-[0_2px_12px_-8px_rgba(61,38,64,0.12)] hover:border-[var(--plum)]/20",
        disabled && "pointer-events-none opacity-60",
      )}
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
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border transition-all duration-200",
            isWayl
              ? selected
                ? "border-[#0F766E]/25 bg-[#0F766E]/[0.06]"
                : "border-[var(--plum)]/8 bg-[var(--mist)]/50"
              : selected
                ? "border-[var(--plum)]/20 bg-[var(--plum)]/[0.05]"
                : "border-[var(--plum)]/8 bg-[var(--mist)]/50",
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
            <IconPackageCheck
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
              <p className="t4 font-medium text-[var(--ink)]">
                {method.nameAr}
              </p>
              <p
                className="t2 mt-0.5 tracking-[0.04em] text-[var(--muted)]"
                dir="ltr"
              >
                {method.name}
              </p>
            </div>

            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                selected
                  ? "scale-100 border-[var(--plum)] bg-[var(--plum)] text-[var(--ivory)] opacity-100"
                  : "scale-100 border-[var(--plum)]/25 bg-transparent opacity-80 group-hover:border-[var(--plum)]/40",
              )}
              aria-hidden
            >
              <IconCheck
                className={cn(
                  "transition-all duration-200",
                  selected ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
              />
            </span>
          </div>

          <p className="t3 leading-relaxed text-[var(--muted)]">
            {method.descriptionAr}
          </p>

          {selected ? (
            <p className="t2 pt-1 font-medium tracking-[0.06em] text-[var(--plum)]/80">
              طريقة الدفع المختارة
            </p>
          ) : null}
        </div>
      </div>
    </label>
  );
}
