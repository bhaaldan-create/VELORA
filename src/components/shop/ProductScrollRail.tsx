"use client";

import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/ProductCard";
import { CompactProductCard } from "@/components/shop/CompactProductCard";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  variant?: "card" | "compact";
  className?: string;
};

/** شريط أفقي خفيف — CSS scroll-snap بدون Swiper */
export function ProductScrollRail({
  products,
  variant = "card",
  className,
}: Props) {
  if (!products.length) return null;

  return (
    <div
      className={cn(
        "velora-scroll-rail flex gap-3 overflow-x-auto overscroll-x-contain pb-1",
        "snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className={cn(
            "snap-start shrink-0",
            variant === "compact"
              ? "w-[42%] min-w-[9.5rem] max-w-[11.5rem] sm:w-[30%] md:w-[22%] lg:w-[18%]"
              : "w-[72%] min-w-[11rem] max-w-[15rem] sm:w-[46%] md:w-[32%] lg:w-[24%] xl:w-[20%]",
          )}
        >
          {variant === "compact" ? (
            <CompactProductCard product={product} />
          ) : (
            <ProductCard product={product} compactOverlayIcons />
          )}
        </div>
      ))}
    </div>
  );
}
