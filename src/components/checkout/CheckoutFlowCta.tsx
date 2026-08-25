"use client";

import type { ReactNode } from "react";
import {
  IconArrowStart,
  IconCreditCard,
  IconFileCheck,
  IconSparkle,
} from "@/components/checkout/CheckoutIcons";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CheckoutFlowAction = "to-payment" | "to-review" | "confirm";

const actionMeta: Record<
  CheckoutFlowAction,
  { label: string; hint: string; Icon: typeof IconCreditCard }
> = {
  "to-payment": {
    label: "المتابعة للدفع",
    hint: "الخطوة التالية — طريقة الدفع",
    Icon: IconCreditCard,
  },
  "to-review": {
    label: "مراجعة الطلب",
    hint: "الخطوة التالية — مراجعة وتأكيد",
    Icon: IconFileCheck,
  },
  confirm: {
    label: "تأكيد الطلب",
    hint: "لحظة أخيرة قبل التأكيد",
    Icon: IconSparkle,
  },
};

type Props = {
  action: CheckoutFlowAction;
  onClick: () => void;
  disabled?: boolean;
  total?: number;
  showTotal?: boolean;
  className?: string;
  variant?: "primary" | "compact";
};

export function CheckoutFlowCta({
  action,
  onClick,
  disabled,
  total,
  showTotal,
  className,
  variant = "primary",
}: Props) {
  const { label, hint, Icon } = actionMeta[action];
  const compact = variant === "compact";

  return (
    <div className={cn("space-y-2", className)}>
      {!compact ? (
        <p className="t2 text-center text-[var(--muted)] sm:text-start">{hint}</p>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "group relative w-full overflow-hidden rounded-[16px] bg-[var(--plum)] text-[var(--ivory)] shadow-[0_10px_32px_-10px_rgba(61,38,64,0.55)] transition-all duration-250",
          "hover:bg-[var(--plum-soft)] hover:shadow-[0_14px_40px_-12px_rgba(61,38,64,0.5)]",
          "active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55",
          compact ? "px-4 py-3" : "px-5 py-4 sm:px-6 sm:py-4",
        )}
        aria-label={label}
      >
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-transparent opacity-80"
          aria-hidden
        />
        <span className="relative flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-[12px] border border-white/20 bg-white/10",
                compact ? "h-9 w-9" : "h-11 w-11",
              )}
            >
              <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </span>
            <span className="min-w-0 text-start">
              <span
                className={cn(
                  "block font-medium leading-tight",
                  compact ? "t3" : "t4",
                )}
              >
                {label}
              </span>
              {showTotal && total != null && !compact ? (
                <span className="font-price t2 mt-0.5 block text-white/75">
                  الإجمالي {formatPrice(total)}
                </span>
              ) : null}
            </span>
          </span>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-transform duration-250 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5",
              compact ? "h-8 w-8" : "h-9 w-9",
            )}
          >
            <IconArrowStart className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </span>
        </span>
      </button>
    </div>
  );
}

/** Sticky bar above bottom navigation on mobile */
export function CheckoutStickyBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-[var(--plum)]/10 bg-[var(--bg-glass-strong)] shadow-[0_-10px_40px_-16px_rgba(61,38,64,0.2)] backdrop-blur-md lg:hidden"
      style={{
        bottom: "calc(4.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-3">{children}</div>
    </div>
  );
}
