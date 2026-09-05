"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/types";
import {
  ProductBadge,
  productDetailBadges,
  productOverlayBadgeLabel,
} from "@/components/shop/ProductBadge";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  locale: string;
  /** Link target for the image. */
  href?: string;
  aspectClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Smaller overlay offsets (home rails / compact cards). */
  compact?: boolean;
  /** Show every badge (new + bestseller). Default: single primary overlay badge. */
  showAllBadges?: boolean;
  showWishlist?: boolean;
  roundedClassName?: string;
  /** Applied to the image element only (hover zoom, etc.). */
  imageClassName?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Fixed product image frame with out-of-flow overlays.
 *
 * Structure (badges/wishlist never affect image metrics):
 * Image Container
 * ├── ProductMedia (owns aspect-ratio)
 * └── Overlay layer (absolute inset-0)
 *      ├── Badges
 *      └── Wishlist
 */
export function ProductCardMediaFrame({
  product,
  locale,
  href,
  aspectClassName = "aspect-[3/4]",
  sizes,
  priority = false,
  compact = false,
  showAllBadges = false,
  showWishlist = true,
  roundedClassName,
  imageClassName,
  className,
  children,
}: Props) {
  const title = locale === "en" ? product.name : product.nameAr;
  const badges = showAllBadges
    ? productDetailBadges(product, locale)
    : (() => {
        const label = productOverlayBadgeLabel(product, locale);
        return label
          ? [{ key: "primary", label }]
          : ([] as { key: string; label: string }[]);
      })();

  const media = (
    <ProductMedia
      name={title}
      imageTone={product.imageTone}
      imageUrl={product.imageUrl}
      aspectClassName={aspectClassName}
      sizes={sizes}
      priority={priority}
      fit="contain"
      imageClassName={imageClassName}
    />
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        roundedClassName,
        className,
      )}
    >
      {href ? (
        <Link href={href} className="block" tabIndex={-1}>
          {media}
        </Link>
      ) : (
        media
      )}

      {/* Overlay layer: absolute, zero layout contribution */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        {badges.length > 0 ? (
          <div
            className={cn(
              "absolute flex max-w-[72%] flex-wrap gap-1",
              compact ? "start-2 top-2" : "start-3 top-3",
            )}
          >
            {badges.map((b) => (
              <ProductBadge key={b.key} label={b.label} size="sm" />
            ))}
          </div>
        ) : null}

        {showWishlist ? (
          <div
            className={cn(
              "pointer-events-auto absolute",
              compact ? "top-2 end-2" : "top-3 end-3",
            )}
          >
            <WishlistHeartButton
              productId={product.id}
              size={compact ? "sm" : "md"}
              className="rounded-full bg-[var(--bg-glass-strong)] text-[var(--icon)] backdrop-blur-sm"
            />
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
