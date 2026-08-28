"use client";

import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export type ProductBadgeSize = "sm" | "md";

const sizeStyles: Record<ProductBadgeSize, string> = {
  sm: "px-2.5 py-1 text-[0.62rem]",
  md: "px-3 py-1.5 text-[0.68rem]",
};

/** Pill badge — same visual language as AddToBagButton (velora-bag-cta). */
export function ProductBadge({
  label,
  size = "sm",
  className,
}: {
  label: string;
  size?: ProductBadgeSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "velora-bag-cta relative isolate inline-flex items-center justify-center",
        "overflow-hidden rounded-full select-none",
        "border border-[var(--bag-cta-border)]",
        "bg-[var(--bag-cta-bg)]",
        "shadow-[var(--bag-cta-shadow)]",
        "font-[family-name:var(--font-body)] font-medium tracking-[0.02em] leading-none",
        sizeStyles[size],
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(120% 80% at 12% 20%, color-mix(in srgb, var(--blush) 22%, transparent), transparent 55%), radial-gradient(90% 70% at 88% 78%, color-mix(in srgb, var(--plum-fill) 10%, transparent), transparent 52%)",
        }}
      />
      <span className="velora-bag-cta-label relative z-[1] text-[var(--bag-cta-fg)]">
        {label}
      </span>
    </span>
  );
}

/** Primary overlay badge — «جديد» takes priority over bestseller. */
export function productOverlayBadgeLabel(
  product: Pick<Product, "isNew" | "isBestseller">,
  locale: string,
): string | null {
  if (product.isNew) return locale === "en" ? "New" : "جديد";
  if (product.isBestseller) {
    return locale === "en" ? "Bestseller" : "الأكثر مبيعاً";
  }
  return null;
}

export function productDetailBadges(
  product: Pick<Product, "isNew" | "isBestseller">,
  locale: string,
): { key: string; label: string }[] {
  const badges: { key: string; label: string }[] = [];
  if (product.isBestseller) {
    badges.push({
      key: "best",
      label: locale === "en" ? "Bestseller" : "الأكثر مبيعاً",
    });
  }
  if (product.isNew) {
    badges.push({
      key: "new",
      label: locale === "en" ? "New" : "جديد",
    });
  }
  return badges;
}
