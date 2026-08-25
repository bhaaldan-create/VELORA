"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function BagPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* Soft shopping bag — clean line */}
      <path
        d="M7.25 8.5h9.5l-.55 9.1a1.6 1.6 0 0 1-1.6 1.5H9.4a1.6 1.6 0 0 1-1.6-1.5L7.25 8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.5V7.1a2.8 2.8 0 0 1 5.6 0v1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Plus badge */}
      <circle cx="17.6" cy="6.4" r="3.15" fill="currentColor" fillOpacity="0.22" />
      <circle
        cx="17.6"
        cy="6.4"
        r="3.15"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M17.6 5.05v2.7M16.25 6.4h2.7"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** حالة تأكيد الإضافة */
  added?: boolean;
  /** نسخة أصغر للشريط الثابت على الجوال */
  compact?: boolean;
};

/**
 * زر شراء VELORA — أفقي عريض، بنفسجي فاخر، RTL.
 * النص ثابت بالعربية حسب مواصفات الواجهة.
 */
export function AddToBagButton({
  added = false,
  compact = false,
  className,
  disabled,
  ...props
}: Props) {
  const label = added ? "أُضيفت" : "أضف للحقيبة";

  return (
    <button
      type="button"
      dir="rtl"
      disabled={disabled}
      aria-label={label}
      className={cn(
        "group relative isolate inline-flex w-full max-w-full items-center justify-center overflow-hidden",
        "rounded-full select-none",
        "border border-white/35",
        "text-white",
        "font-[family-name:var(--font-body)] font-semibold tracking-[0.01em]",
        "transition-[transform,box-shadow,filter] duration-200 ease-out",
        "will-change-transform",
        /* Soft lavender luxury gradient */
        "bg-[linear-gradient(135deg,#b39bc0_0%,#9578a8_42%,#7d5f92_100%)]",
        /* Soft neumorphism + lavender glow */
        "shadow-[0_10px_28px_-12px_rgba(125,95,146,0.55),0_1px_0_rgba(255,255,255,0.28)_inset,0_-1px_0_rgba(61,38,64,0.12)_inset]",
        "hover:-translate-y-[2px] hover:brightness-[1.06]",
        "hover:shadow-[0_14px_34px_-12px_rgba(125,95,146,0.62),0_1px_0_rgba(255,255,255,0.34)_inset]",
        "active:translate-y-0 active:scale-[0.985] active:brightness-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b39bc0]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]",
        "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
        /* ~4:1 feel via height + full width */
        compact
          ? "min-h-11 gap-2.5 px-3.5 text-[0.84rem] sm:min-h-11"
          : "min-h-[3.35rem] gap-3 px-4 text-[0.95rem] sm:min-h-14 sm:gap-3.5 sm:px-5 sm:text-[1rem]",
        className,
      )}
      {...props}
    >
      {/* Glass sheen — very subtle */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.04)_42%,rgba(255,255,255,0)_100%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-full bg-white/[0.06]"
      />

      <span
        className={cn(
          "relative z-[1] inline-flex shrink-0 items-center justify-center rounded-full",
          "bg-[color-mix(in_srgb,#5c3a5e_72%,#3d2640)] text-white",
          "shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_4px_10px_-4px_rgba(61,38,64,0.45)]",
          "ring-1 ring-white/15",
          "transition-transform duration-200 ease-out group-hover:scale-[1.03]",
          compact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10",
        )}
      >
        <BagPlusIcon
          className={cn(compact ? "h-[1.05rem] w-[1.05rem]" : "h-5 w-5")}
        />
      </span>

      <span className="relative z-[1] min-w-0 leading-none">{label}</span>
    </button>
  );
}
