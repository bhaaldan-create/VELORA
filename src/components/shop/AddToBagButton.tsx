"use client";

import { useState, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type AddToBagButtonSize = "lg" | "md" | "sm" | "compact";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  added?: boolean;
  /** @deprecated استخدم size="compact" */
  compact?: boolean;
  size?: AddToBagButtonSize;
  /** يعرض «أُضيفت» لفترة قصيرة تلقائياً بعد الضغط */
  flashAdded?: boolean;
};

const sizeStyles: Record<AddToBagButtonSize, string> = {
  lg: "min-h-[3.25rem] px-7 text-[0.95rem] sm:min-h-[3.5rem] sm:px-8 sm:text-[1rem]",
  md: "min-h-11 px-6 text-[0.84rem]",
  sm: "min-h-9 px-5 text-[0.78rem]",
  compact: "min-h-11 px-5 text-[0.82rem]",
};

/**
 * زر «أضف للحقيبة» الموحّد — نص فقط، أبيض فاخر، بنفسجي VELORA.
 * بدون أيقونة حقيبة.
 */
export function AddToBagButton({
  added = false,
  compact = false,
  size,
  flashAdded = false,
  className,
  disabled,
  onClick,
  ...props
}: Props) {
  const [flashed, setFlashed] = useState(false);
  const resolvedSize: AddToBagButtonSize =
    size ?? (compact ? "compact" : "lg");
  const showAdded = added || flashed;
  const label = showAdded ? "أُضيفت" : "أضف للحقيبة";

  return (
    <button
      type="button"
      dir="rtl"
      disabled={disabled}
      aria-label={label}
      onClick={(e) => {
        onClick?.(e);
        if (!flashAdded || e.defaultPrevented || disabled) return;
        setFlashed(true);
        window.setTimeout(() => setFlashed(false), 1600);
      }}
      className={cn(
        "velora-bag-cta group relative isolate inline-flex w-full max-w-full items-center justify-center",
        "overflow-hidden rounded-full select-none",
        "border border-[var(--bag-cta-border)]",
        "bg-[var(--bag-cta-bg)]",
        "shadow-[var(--bag-cta-shadow)]",
        "transition-[transform,box-shadow,background-color,border-color,filter] duration-220 ease-out",
        "hover:-translate-y-px hover:bg-[var(--bag-cta-bg-hover)] hover:shadow-[var(--bag-cta-shadow-hover)]",
        "active:translate-y-0 active:scale-[0.985]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plum-fill)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
        sizeStyles[resolvedSize],
        className,
      )}
      {...props}
    >
      {/* Soft lilac wash — organic, not neon */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120% 80% at 12% 20%, color-mix(in srgb, var(--blush) 22%, transparent), transparent 55%), radial-gradient(90% 70% at 88% 78%, color-mix(in srgb, var(--plum-fill) 10%, transparent), transparent 52%)",
        }}
      />

      <span
        className={cn(
          "velora-bag-cta-label relative z-[1] font-[family-name:var(--font-body)]",
          "font-medium tracking-[0.02em] leading-none",
          "text-[var(--bag-cta-fg)]",
          showAdded && "opacity-90",
        )}
      >
        {label}
      </span>
    </button>
  );
}
