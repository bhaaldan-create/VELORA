"use client";

import Image from "next/image";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { productCopy } from "./copy";

type Props = {
  product: Product;
  ar: boolean;
};

export function ProductHeroImage({ product, ar }: Props) {
  const copy = productCopy(ar);
  const badges: { key: string; label: string }[] = [];
  if (product.isBestseller) {
    badges.push({ key: "best", label: copy.bestSeller });
  }
  if (product.isNew) {
    badges.push({ key: "new", label: copy.newBadge });
  }
  if (product.discountPercent && product.discountPercent > 0) {
    badges.push({
      key: "sale",
      label: `${copy.saleBadge} ${product.discountPercent}%`,
    });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] sm:rounded-[32px]",
        "bg-gradient-to-b from-[#f3ece8] to-[#ebe3df]",
        "shadow-[0_18px_48px_rgba(50,22,47,0.08)]",
        "motion-safe:animate-[velora-fade_0.9s_ease-out_both]",
      )}
    >
      <ProductMedia
        name={ar ? product.nameAr : product.name}
        imageTone={product.imageTone}
        imageUrl={product.imageUrl}
        aspectClassName="aspect-[4/5] sm:aspect-[5/6]"
        className="w-full rounded-[28px] sm:rounded-[32px]"
        sizes="(max-width: 1024px) 100vw, 48vw"
        priority
      />

      <WishlistHeartButton
        productId={product.id}
        className="absolute end-3 top-3 z-[2] rounded-full border border-white/50 bg-white/85 p-2.5 text-[var(--plum)] shadow-[0_8px_24px_rgba(50,22,47,0.1)] backdrop-blur-md sm:end-4 sm:top-4"
      />

      {badges.length > 0 ? (
        <div className="absolute start-3 top-3 z-[2] flex max-w-[70%] flex-wrap gap-1.5 sm:start-4 sm:top-4">
          {badges.map((b) => (
            <span
              key={b.key}
              className="rounded-full bg-[var(--plum)]/90 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.04em] text-white backdrop-blur-sm"
            >
              {b.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProductBrandLogo({
  brandName,
  brandLogoUrl,
}: {
  brandName?: string | null;
  brandLogoUrl?: string | null;
}) {
  if (!brandLogoUrl) return null;
  const isData = brandLogoUrl.startsWith("data:");
  return (
    <div className="mb-4" dir="ltr">
      <div className="relative h-9 w-auto max-w-[180px] sm:h-10 sm:max-w-[200px]">
        <Image
          src={brandLogoUrl}
          alt={brandName ? `${brandName} logo` : "Brand logo"}
          width={200}
          height={40}
          unoptimized={isData}
          className="h-9 w-auto max-h-10 max-w-full object-contain object-left sm:h-10"
        />
      </div>
    </div>
  );
}
