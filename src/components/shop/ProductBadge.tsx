"use client";

import type { Product } from "@/types";
import { isProductInStock, soldOutLabel } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export type ProductBadgeSize = "sm" | "md";
export type ProductBadgeTone = "default" | "soldOut";

const sizeStyles: Record<ProductBadgeSize, string> = {
  sm: "px-2.5 py-1 text-[0.62rem]",
  md: "px-3 py-1.5 text-[0.68rem]",
};

/** Pill badge — same visual language as AddToBagButton (velora-bag-cta). */
export function ProductBadge({
  label,
  size = "sm",
  tone = "default",
  className,
}: {
  label: string;
  size?: ProductBadgeSize;
  tone?: ProductBadgeTone;
  className?: string;
}) {
  if (tone === "soldOut") {
    return (
      <span
        className={cn(
          "relative isolate inline-flex items-center justify-center",
          "overflow-hidden rounded-full select-none",
          "border border-[#c45a5a]/35",
          "bg-[linear-gradient(145deg,#c45a5a_0%,#a63d45_100%)]",
          "shadow-[0_8px_20px_-10px_rgba(166,61,69,0.55)]",
          "font-[family-name:var(--font-body)] font-medium tracking-[0.08em] leading-none",
          "text-[#fff8f7]",
          sizeStyles[size],
          className,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(120% 80% at 18% 15%, rgba(255,255,255,0.22), transparent 55%)",
          }}
        />
        <span className="relative z-[1]">{label}</span>
      </span>
    );
  }

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

/** Primary overlay badge — sold out wins over New / Bestseller. */
export function productOverlayBadgeLabel(
  product: Pick<Product, "isNew" | "isBestseller" | "stock">,
  locale: string,
): { label: string; tone: ProductBadgeTone } | null {
  if (!isProductInStock(product)) {
    return { label: soldOutLabel(locale), tone: "soldOut" };
  }
  if (product.isNew) {
    return { label: locale === "en" ? "New" : "جديد", tone: "default" };
  }
  if (product.isBestseller) {
    return {
      label: locale === "en" ? "Bestseller" : "الأكثر مبيعاً",
      tone: "default",
    };
  }
  return null;
}

export function productDetailBadges(
  product: Pick<Product, "isNew" | "isBestseller" | "stock">,
  locale: string,
): { key: string; label: string; tone: ProductBadgeTone }[] {
  const badges: { key: string; label: string; tone: ProductBadgeTone }[] = [];
  if (!isProductInStock(product)) {
    badges.push({
      key: "sold-out",
      label: soldOutLabel(locale),
      tone: "soldOut",
    });
    return badges;
  }
  if (product.isBestseller) {
    badges.push({
      key: "best",
      label: locale === "en" ? "Bestseller" : "الأكثر مبيعاً",
      tone: "default",
    });
  }
  if (product.isNew) {
    badges.push({
      key: "new",
      label: locale === "en" ? "New" : "جديد",
      tone: "default",
    });
  }
  return badges;
}
