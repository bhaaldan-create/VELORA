"use client";

import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Editorial PDP: show old → % → current */
  layout?: "default" | "editorial";
};

export function ProductPrice({
  price,
  originalPrice,
  discountPercent,
  className,
  size = "md",
  layout = "default",
}: Props) {
  const onSale =
    typeof originalPrice === "number" &&
    originalPrice > price &&
    (discountPercent ?? 0) > 0;

  const priceClass =
    size === "lg" ? "t5" : size === "sm" ? "t2" : "t3";

  if (layout === "editorial" && onSale) {
    return (
      <span
        className={cn(
          "font-price inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1",
          className,
        )}
      >
        <span
          className={cn(
            size === "sm" ? "text-[0.72rem]" : "text-[0.82rem]",
            "text-[var(--muted)] line-through",
          )}
        >
          {formatPrice(originalPrice)}
        </span>
        <span className="rounded-md bg-[var(--blush)]/35 px-1.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.02em] text-[var(--plum)]">
          −{discountPercent}%
        </span>
        <span
          className={cn(
            priceClass,
            "font-semibold text-[var(--plum)]",
            size === "lg" && "text-[1.45rem] sm:text-[1.65rem]",
          )}
        >
          {formatPrice(price)}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("font-price inline-flex flex-wrap items-baseline gap-2", className)}>
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
