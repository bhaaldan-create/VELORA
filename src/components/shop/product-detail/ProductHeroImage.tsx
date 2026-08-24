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

  return (
    <div className="motion-safe:animate-[velora-fade_0.95s_ease-out_both]">
      <div
        className={cn(
          "relative overflow-hidden",
          "rounded-[2rem] sm:rounded-[2.25rem]",
          "bg-[radial-gradient(120%_90%_at_50%_12%,#faf6f3_0%,#f3ebe6_42%,#ebe2dc_100%)]",
          "shadow-[0_28px_64px_-28px_rgba(50,22,47,0.22)]",
          "ring-1 ring-[var(--plum)]/[0.06]",
        )}
      >
        {/* Soft editorial light wash */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(255,255,255,0.55) 0%, transparent 62%), linear-gradient(180deg, transparent 55%, rgba(61,38,64,0.04) 100%)",
          }}
        />

        <ProductMedia
          name={ar ? product.nameAr : product.name}
          imageTone={product.imageTone}
          imageUrl={product.imageUrl}
          aspectClassName="aspect-[4/5] sm:aspect-[5/6]"
          className="relative z-[1] w-full rounded-[2rem] sm:rounded-[2.25rem]"
          sizes="(max-width: 1024px) 100vw, 46vw"
          priority
        />

        <WishlistHeartButton
          productId={product.id}
          className="absolute end-3.5 top-3.5 z-[2] rounded-full border border-white/55 bg-white/80 p-2.5 text-[var(--plum)] shadow-[0_10px_28px_rgba(50,22,47,0.12)] backdrop-blur-md sm:end-4 sm:top-4"
        />

        {badges.length > 0 ? (
          <div className="absolute start-3.5 top-3.5 z-[2] flex max-w-[68%] flex-wrap gap-1.5 sm:start-4 sm:top-4">
            {badges.map((b) => (
              <span
                key={b.key}
                className="rounded-full bg-[var(--plum)]/88 px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.06em] text-white backdrop-blur-sm"
              >
                {b.label}
              </span>
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
      <div
        className="mb-3.5 h-px w-10 bg-[var(--plum)]/15"
        aria-hidden
      />
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
