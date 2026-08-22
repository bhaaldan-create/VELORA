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

/** بطاقة مضغوطة — أكبر عدد منتجات في الشاشة */
export function CompactProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { addItem } = useCart();
  const { locale, t } = useLocale();
  const brand = getProductBrand(product.name, product.nameAr);
  const title = locale === "en" ? product.name : product.nameAr;

  return (
    <article className={cn("group flex h-full flex-col", className)}>
      <div className="relative overflow-hidden rounded-2xl bg-[var(--mist)]/50">
        <WishlistHeartButton
          productId={product.id}
          size="sm"
          className="absolute top-2 end-2 rounded-full bg-[var(--ivory)]/90 backdrop-blur-sm"
        />
        <Link href={`/shop/${product.slug}`} className="block">
          <ProductMedia
            name={title}
            imageTone={product.imageTone}
            imageUrl={product.imageUrl}
            aspectClassName="aspect-[3/4]"
            className="transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 42vw, 18vw"
          />
          {product.isNew || product.isBestseller ? (
            <span className="absolute top-2 start-2 rounded-full bg-[var(--ivory)]/95 px-2 py-0.5 font-latin text-[9px] font-semibold tracking-[0.08em] text-[var(--plum)] uppercase">
              {product.isNew
                ? locale === "en"
                  ? "New"
                  : "جديد"
                : locale === "en"
                  ? "Best"
                  : "مميز"}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="flex flex-1 flex-col pt-2.5">
        <p
          className="font-latin truncate text-[9px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase"
          dir="ltr"
        >
          {brand}
        </p>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mt-0.5 line-clamp-2 text-[0.78rem] font-medium leading-snug text-[var(--ink)]">
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
        <button
          type="button"
          onClick={() => addItem(product)}
          className="mt-2 w-full rounded-full border border-[var(--plum)]/12 py-1.5 font-latin text-[9px] font-semibold tracking-[0.1em] text-[var(--plum)] uppercase transition-colors hover:bg-[var(--plum)] hover:text-[var(--btn-fg)]"
        >
          {t.addToBag}
        </button>
      </div>
    </article>
  );
}
