"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import { getProductBrand } from "@/lib/product-brand";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  compactOverlayIcons,
}: {
  product: Product;
  className?: string;
  /** أيقونات أصغر — للصفحة الرئيسية فقط */
  compactOverlayIcons?: boolean;
}) {
  const { addItem } = useCart();
  const { locale, t } = useLocale();
  const brand = getProductBrand(product.name, product.nameAr);
  const title = locale === "en" ? product.name : product.nameAr;
  const badge =
    product.isNew
      ? locale === "en"
        ? "New"
        : "جديد"
      : product.isBestseller
        ? locale === "en"
          ? "Bestseller"
          : "الأكثر مبيعاً"
        : null;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--plum)]/8 bg-[color-mix(in_srgb,var(--ivory)_92%,white)] shadow-[0_10px_28px_rgba(50,22,47,0.04)] transition-shadow duration-300 hover:shadow-[0_16px_36px_rgba(50,22,47,0.07)]",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-[var(--mist)]/40">
        <WishlistHeartButton
          productId={product.id}
          size={compactOverlayIcons ? "sm" : "md"}
          className={cn(
            "absolute z-10 bg-[var(--ivory)]/90 backdrop-blur-sm",
            compactOverlayIcons ? "top-2.5 end-2.5" : "top-3 end-3",
          )}
        />

        {badge ? (
          <span
            className={cn(
              "absolute z-10 rounded-full bg-[var(--ivory)]/95 font-medium tracking-[0.12em] text-[var(--plum)] uppercase",
              compactOverlayIcons
                ? "top-2.5 start-2.5 px-2 py-0.5 text-[9px]"
                : "top-3 start-3 px-2.5 py-1 text-[10px]",
            )}
          >
            {badge}
          </span>
        ) : null}

        <Link href={`/shop/${product.slug}`} className="block">
          <ProductMedia
            name={title}
            imageTone={product.imageTone}
            imageUrl={product.imageUrl}
            aspectClassName="aspect-[3/4]"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 55vw, 25vw"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <p
          className="text-[10px] font-medium tracking-[0.18em] text-[var(--muted)] uppercase"
          dir="ltr"
        >
          {brand}
        </p>
        <Link href={`/shop/${product.slug}`} className="mt-1.5">
          <h3 className="line-clamp-2 text-[0.95rem] font-medium leading-snug text-[var(--ink)] transition-opacity group-hover:opacity-75">
            {title}
          </h3>
        </Link>
        <ProductPrice
          className="mt-2"
          size="sm"
          price={product.price}
          originalPrice={product.originalPrice}
          discountPercent={product.discountPercent}
        />

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => addItem(product)}
            className={cn(
              "w-full rounded-full border border-[var(--plum)]/15 bg-transparent px-3 py-2.5",
              "text-[11px] font-medium tracking-[0.14em] text-[var(--plum)] uppercase",
              "transition-all duration-300",
              "hover:border-[var(--plum)]/40 hover:bg-[var(--plum)] hover:text-[var(--btn-fg)]",
              "active:scale-[0.98]",
            )}
          >
            {t.addToBag}
          </button>
        </div>
      </div>
    </article>
  );
}
