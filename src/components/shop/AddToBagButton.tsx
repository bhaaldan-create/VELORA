"use client";

import { useState, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** حقيبة خطية نظيفة + علامة + بسيطة — بدون دائرة متداخلة */
function BagPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M8.25 9.25V7.6a3.75 3.75 0 0 1 7.5 0v1.65"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.6 9.25h10.8l-.7 9.35a1.85 1.85 0 0 1-1.84 1.7H9.14a1.85 1.85 0 0 1-1.84-1.7L6.6 9.25Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.15v3.4M10.3 13.85h3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type AddToBagButtonSize = "lg" | "md" | "sm" | "compact";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  added?: boolean;
  /** @deprecated استخدم size="compact" */
  compact?: boolean;
  size?: AddToBagButtonSize;
  /** يعرض «أُضيفت» لفترة قصيرة تلقائياً بعد الضغط */
  flashAdded?: boolean;
};

const sizeStyles: Record<
  AddToBagButtonSize,
  { btn: string; iconWrap: string; icon: string }
> = {
  lg: {
    btn: "min-h-[3.35rem] gap-3 px-4 text-[0.95rem] sm:min-h-14 sm:gap-3.5 sm:px-5 sm:text-[1rem]",
    iconWrap: "h-9 w-9 sm:h-10 sm:w-10",
    icon: "h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5",
  },
  md: {
    btn: "min-h-11 gap-2.5 px-3.5 text-[0.84rem]",
    iconWrap: "h-8 w-8",
    icon: "h-4 w-4",
  },
  sm: {
    btn: "min-h-9 gap-2 px-3 text-[0.75rem]",
    iconWrap: "h-7 w-7",
    icon: "h-3.5 w-3.5",
  },
  compact: {
    btn: "min-h-11 gap-2.5 px-3.5 text-[0.84rem]",
    iconWrap: "h-8 w-8",
    icon: "h-4 w-4",
  },
};

/**
 * زر شراء VELORA الموحّد — أفقي، بنفسجي فاخر، عربي فقط.
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
  const styles = sizeStyles[resolvedSize];
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
        "group relative isolate inline-flex w-full max-w-full items-center justify-center overflow-hidden",
        "rounded-full select-none",
        "border border-white/30",
        "text-white",
        "font-[family-name:var(--font-body)] font-semibold tracking-[0.01em]",
        "transition-[transform,box-shadow,filter] duration-200 ease-out",
        "bg-[linear-gradient(135deg,#b39bc0_0%,#9578a8_45%,#7d5f92_100%)]",
        "shadow-[0_8px_22px_-12px_rgba(125,95,146,0.5),0_1px_0_rgba(255,255,255,0.26)_inset]",
        "hover:-translate-y-px hover:brightness-[1.05]",
        "hover:shadow-[0_12px_28px_-12px_rgba(125,95,146,0.58),0_1px_0_rgba(255,255,255,0.32)_inset]",
        "active:translate-y-0 active:scale-[0.985] active:brightness-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b39bc0]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]",
        "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
        styles.btn,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0)_100%)]"
      />

      <span
        className={cn(
          "relative z-[1] inline-flex shrink-0 items-center justify-center rounded-full",
          "bg-[#4a334d]/88 text-white",
          "ring-1 ring-white/12",
          styles.iconWrap,
        )}
      >
        <BagPlusIcon className={styles.icon} />
      </span>

      <span className="relative z-[1] min-w-0 truncate leading-none">
        {label}
      </span>
    </button>
  );
}
