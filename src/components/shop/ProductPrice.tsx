"use client";

import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function ProductPrice({
  price,
  originalPrice,
  discountPercent,
  className,
  size = "md",
}: Props) {
  const onSale =
    typeof originalPrice === "number" &&
    originalPrice > price &&
    (discountPercent ?? 0) > 0;

  const priceClass =
    size === "lg" ? "t5" : size === "sm" ? "t3" : "t3";

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn(priceClass, "font-medium text-[var(--ink)]/85")}>
        {formatPrice(price)}
      </span>
      {onSale ? (
        <>
          <span
            className={cn(
              size === "sm" ? "t2" : "t3",
              "text-[var(--muted)] line-through",
            )}
          >
            {formatPrice(originalPrice)}
          </span>
          <span className="t1 bg-[var(--blush)]/40 px-1.5 py-0.5 font-medium text-[var(--plum)]">
            −{discountPercent}%
          </span>
        </>
      ) : null}
    </span>
  );
}
