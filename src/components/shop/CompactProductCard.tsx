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

/** بطاقة مضغوطة — أكبر عدد منتجات في الشاشة */
export function CompactProductCard({
  product,
  className,
  priority = false,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const { locale } = useLocale();
  const brand = getProductBrand(product.name, product.nameAr);
  const title = locale === "en" ? product.name : product.nameAr;
  const inStock = isProductInStock(product);

  return (
    <article className={cn("group flex h-full flex-col", className)}>
      <ProductCardMediaFrame
        product={product}
        locale={locale}
        href={`/shop/${product.slug}`}
        compact
        priority={priority}
        roundedClassName="rounded-2xl"
        aspectClassName="aspect-[3/4]"
        sizes="(max-width: 768px) 42vw, 18vw"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
      />

      <div className="flex flex-1 flex-col pt-2.5">
        <p
          className="font-latin truncate text-[9px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase"
          dir="ltr"
        >
          {brand}
        </p>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-display mt-0.5 line-clamp-2 min-h-[2.4em] text-[0.78rem] font-medium leading-snug text-[var(--ink)]">
            {title}
          </h3>
        </Link>
        <ProductPrice
          className="mt-1.5"
          size="sm"
          price={product.price}
          originalPrice={product.originalPrice}
          discountPercent={product.discountPercent}
        />
        <div className="mt-auto pt-2">
          {inStock ? (
            <AddToBagButton
              size="sm"
              flashAdded
              onClick={() => addItem(product)}
            />
          ) : (
            <div
              className="flex min-h-9 w-full items-center justify-center rounded-full border border-[#c45a5a]/22 bg-[linear-gradient(145deg,rgba(196,90,90,0.1),rgba(166,61,69,0.06))] text-[0.78rem] font-medium tracking-[0.06em] text-[#a63d45]"
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
