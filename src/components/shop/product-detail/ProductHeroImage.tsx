"use client";

import Image from "next/image";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductBadge, productDetailBadges } from "@/components/shop/ProductBadge";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import type { Product } from "@/types";

type Props = {
  product: Product;
  ar: boolean;
};

export function ProductHeroImage({ product, ar }: Props) {
  const badges = productDetailBadges(product, ar ? "ar" : "en");

  return (
    <div className="motion-safe:animate-[velora-fade_0.95s_ease-out_both]">
      <div className="relative overflow-hidden rounded-[2rem] shadow-[var(--shadow-md)] ring-1 ring-[var(--border)] sm:rounded-[2.25rem]">
        <ProductMedia
          name={ar ? product.nameAr : product.name}
          imageTone={product.imageTone}
          imageUrl={product.imageUrl}
          aspectClassName="aspect-[4/5] sm:aspect-[5/6]"
          className="w-full"
          sizes="(max-width: 1024px) 100vw, 46vw"
          priority
        />

        <WishlistHeartButton
          productId={product.id}
          className="absolute end-3.5 top-3.5 z-[2] rounded-full border border-[var(--border-glass)] bg-[var(--bg-glass)] p-2.5 text-[var(--plum)] shadow-[var(--shadow-md)] backdrop-blur-md sm:end-4 sm:top-4"
        />

        {badges.length > 0 ? (
          <div className="absolute start-3.5 top-3.5 z-[2] flex max-w-[72%] flex-wrap gap-1.5 sm:start-4 sm:top-4">
            {badges.map((b) => (
              <ProductBadge key={b.key} label={b.label} size="md" />
            ))}
          </div>
        ) : null}
      </div>

      <ProductBrandLogo
        brandName={product.brandName}
        brandLogoUrl={product.brandLogoUrl}
      />
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
    <div
      className="mt-5 flex flex-col items-center motion-safe:animate-[velora-rise_0.7s_0.12s_ease-out_both] sm:mt-6"
      dir="ltr"
    >
      <div className="mb-3.5 h-px w-10 bg-[var(--plum)]/15" aria-hidden />
      <div className="relative flex h-8 max-w-[min(100%,220px)] items-center justify-center sm:h-9 sm:max-w-[240px]">
        <Image
          src={brandLogoUrl}
          alt={brandName ? `${brandName} logo` : "Brand logo"}
          width={240}
          height={40}
          unoptimized={isData}
          className="h-8 w-auto max-h-9 max-w-full object-contain object-center sm:h-9"
        />
      </div>
    </div>
  );
}
