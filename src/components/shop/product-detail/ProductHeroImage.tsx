"use client";

import Image from "next/image";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductBadge, productDetailBadges } from "@/components/shop/ProductBadge";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
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
          fit="contain"
        />

        {/* Overlay layer — never participates in image sizing */}
        <div className="pointer-events-none absolute inset-0 z-[2]">
          <WishlistHeartButton
            productId={product.id}
            className="pointer-events-auto absolute end-3.5 top-3.5 rounded-full border border-[var(--border-glass)] bg-[var(--bg-glass)] p-2.5 text-[var(--plum)] shadow-[var(--shadow-md)] backdrop-blur-md sm:end-4 sm:top-4"
          />

          {badges.length > 0 ? (
            <div className="absolute start-3.5 top-3.5 flex max-w-[72%] flex-wrap gap-1.5 sm:start-4 sm:top-4">
              {badges.map((b) => (
                <ProductBadge key={b.key} label={b.label} size="md" />
              ))}
            </div>
          ) : null}
        </div>
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
  const useNative = shouldUseNativeImageElement(brandLogoUrl);

  return (
    <div
      className="mt-5 flex flex-col items-center motion-safe:animate-[velora-rise_0.7s_0.12s_ease-out_both] sm:mt-6"
      dir="ltr"
    >
      <div className="mb-4 h-px w-11 bg-[var(--plum)]/15" aria-hidden />
      <div className="relative flex h-10 max-w-[min(100%,280px)] items-center justify-center sm:h-11 sm:max-w-[320px] md:h-12 md:max-w-[340px]">
        {useNative ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandLogoUrl}
            alt={brandName ? `${brandName} logo` : "Brand logo"}
            className="h-auto max-h-10 w-auto max-w-full object-contain object-center sm:max-h-11 md:max-h-12"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              if (process.env.NODE_ENV === "development") {
                console.warn("[ProductBrandLogo] failed", brandLogoUrl);
              }
            }}
          />
        ) : (
          <Image
            src={brandLogoUrl}
            alt={brandName ? `${brandName} logo` : "Brand logo"}
            width={340}
            height={48}
            className="h-auto max-h-10 w-auto max-w-full object-contain object-center sm:max-h-11 md:max-h-12"
          />
        )}
      </div>
    </div>
  );
}
