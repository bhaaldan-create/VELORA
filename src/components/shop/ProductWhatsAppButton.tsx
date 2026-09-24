"use client";

import { IconWhatsApp } from "@/components/contact/SocialIcons";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  hint?: string;
  /** Premium primary CTA for product detail */
  variant?: "default" | "hero";
  className?: string;
};

/**
 * زر طلب واتساب داخل صفحة المنتج —
 * يحافظ على الرابط الحالي مع مظهر فاخر قابل للترقية.
 */
export function ProductWhatsAppButton({
  href,
  label,
  hint,
  variant = "default",
  className,
}: Props) {
  if (variant === "hero") {
    return (
      <div className={cn("w-full", className)}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          dir="rtl"
          className="pdp-wa-hero focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plum-fill)]/28 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <IconWhatsApp size={18} className="shrink-0 text-[#e8f5ef]" />
          <span className="leading-none">{label}</span>
        </a>
        {hint ? (
          <p className="mt-2 text-center text-[0.7rem] leading-relaxed text-[var(--muted)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      dir="rtl"
      className={cn(
        "velora-wa-cta group relative inline-flex w-full max-w-full items-center justify-center gap-2",
        "min-h-10 rounded-full px-4 sm:min-h-[2.65rem] sm:px-5",
        "border border-[var(--wa-cta-border)] bg-[var(--wa-cta-bg)]",
        "text-[0.78rem] font-medium tracking-[0.01em] text-[var(--wa-cta-fg)] sm:text-[0.8rem]",
        "font-[family-name:var(--font-body)]",
        "shadow-[var(--wa-cta-shadow)]",
        "transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out",
        "hover:-translate-y-px hover:bg-[var(--wa-cta-bg-hover)] hover:border-[var(--wa-cta-border-hover)] hover:text-[var(--wa-cta-fg-hover)]",
        "active:translate-y-0 active:scale-[0.985]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plum-fill)]/28 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className,
      )}
    >
      <IconWhatsApp
        size={14}
        className="shrink-0 text-[var(--wa-cta-icon)] transition-colors duration-200 group-hover:text-[var(--wa-cta-icon-hover)]"
      />
      <span className="min-w-0 truncate leading-none">{label}</span>
    </a>
  );
}
