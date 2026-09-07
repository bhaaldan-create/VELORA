"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductCardMediaFrame } from "@/components/shop/ProductCardMediaFrame";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { getProductBrand } from "@/lib/product-brand";
import { isProductInStock, soldOutLabel } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  compactOverlayIcons,
  priority = false,
}: {
  product: Product;
  className?: string;
  /** أيقونات أصغر — للصفحة الرئيسية فقط */
  compactOverlayIcons?: boolean;
  /** Eager-load above-the-fold / first rail cards */
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const { locale } = useLocale();
  const brand = getProductBrand(product.name, product.nameAr);
  const title = locale === "en" ? product.name : product.nameAr;
  const inStock = isProductInStock(product);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[22px] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)] ring-1 ring-[var(--border)] transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]",
        className,
      )}
    >
      <ProductCardMediaFrame
        product={product}
        locale={locale}
        href={`/shop/${product.slug}`}
        compact={compactOverlayIcons}
        priority={priority}
        aspectClassName="aspect-[3/4]"
        sizes="(max-width: 768px) 55vw, 25vw"
        imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />

      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <p
          className="text-[10px] font-medium tracking-[0.18em] text-[var(--muted)] uppercase"
          dir="ltr"
        >
          {brand}
        </p>
        <Link href={`/shop/${product.slug}`} className="mt-1.5">
          <h3 className="font-display line-clamp-2 min-h-[2.4em] text-[0.95rem] font-medium leading-snug text-[var(--ink)] transition-opacity group-hover:opacity-75">
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

        <div className="mt-auto pt-3.5">
          {inStock ? (
            <AddToBagButton
              size="md"
              flashAdded
              onClick={() => addItem(product)}
            />
          ) : (
            <div
              className="flex min-h-11 w-full items-center justify-center rounded-full border border-[#c45a5a]/22 bg-[linear-gradient(145deg,rgba(196,90,90,0.1),rgba(166,61,69,0.06))] text-[0.84rem] font-medium tracking-[0.06em] text-[#a63d45]"
              aria-label={soldOutLabel(locale)}
            >
              {soldOutLabel(locale)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
