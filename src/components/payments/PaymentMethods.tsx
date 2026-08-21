import Image from "next/image";
import { paymentMethods, type PaymentMethod } from "@/data/payments";
import { cn } from "@/lib/utils";

export function PaymentLogo({
  method,
  className,
  compact = false,
}: {
  method: PaymentMethod;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-sm",
        compact ? "h-9 px-2.5" : "h-12 px-3",
        method.badgeClass ?? "bg-[var(--ivory)]",
        className,
      )}
    >
      <Image
        src={method.logo}
        alt={method.name}
        width={compact ? 56 : 72}
        height={compact ? 28 : 36}
        className={cn(
          "h-auto w-auto object-contain",
          compact ? "max-h-6 max-w-[52px]" : "max-h-8 max-w-[70px]",
        )}
      />
    </span>
  );
}

/** صف شعارات مرتب — للفوتر والصفحة الرئيسية */
export function PaymentMethodsRow({
  title = "طرق الدفع",
  dark = false,
}: {
  title?: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "t1 font-medium tracking-[0.18em]",
          dark ? "text-[var(--blush)]" : "text-[var(--muted)]",
        )}
      >
        {title}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {paymentMethods.map((method) => (
          <PaymentLogo
            key={method.id}
            method={method}
            compact
            className={
              dark && !method.badgeClass
                ? "bg-white/95"
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

/** اختيار طريقة الدفع في صفحة الدفع */
export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="t1 font-medium tracking-[0.14em] text-[var(--muted)]">
        طريقة الدفع
      </legend>
      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const selected = value === method.id;
          return (
            <label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-center gap-4 border px-4 py-3 transition-colors",
                selected
                  ? "border-[var(--plum)] bg-[var(--mist)]"
                  : "border-[var(--plum)]/15 hover:border-[var(--plum)]/35",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selected}
                onChange={() => onChange(method.id)}
                className="accent-[var(--plum)]"
              />
              <PaymentLogo method={method} />
              <span className="min-w-0 flex-1">
                <span className="t3 block font-medium text-[var(--plum)]">
                  {method.nameAr}
                </span>
                <span className="t2 block text-[var(--muted)]" dir="ltr">
                  {method.name}
                </span>
                <span className="t2 mt-1 block text-[var(--ink)]/60">
                  {method.descriptionAr}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
