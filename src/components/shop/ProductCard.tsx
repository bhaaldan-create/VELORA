"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { categoryLabels, ui } from "@/constants/brand";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="group flex flex-col">
      <Link href={`/shop/${product.slug}`} className="relative block overflow-hidden">
        <ProductMedia
          name={product.nameAr}
          imageTone={product.imageTone}
          imageUrl={product.imageUrl}
          className="transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 start-3 flex gap-2">
          {product.isBestseller ? (
            <span className="t1 bg-[var(--ivory)]/95 px-2 py-1 font-medium text-[var(--plum)]">
              {ui.bestsellers}
            </span>
          ) : null}
          {product.isNew ? (
            <span className="t1 bg-[var(--plum)]/90 px-2 py-1 font-medium text-[var(--ivory)]">
              جديد
            </span>
          ) : null}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="t1 font-medium tracking-[0.12em] text-[var(--muted)]">
          {categoryLabels[product.category]}
        </p>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-display t5 mt-1 font-medium text-[var(--plum)] transition-opacity group-hover:opacity-80">
            {product.nameAr}
          </h3>
        </Link>
        <p className="t1 mt-0.5 tracking-[0.04em] text-[var(--muted)]" dir="ltr">
          {product.name}
        </p>
        <ProductPrice
          className="mt-2"
          price={product.price}
          originalPrice={product.originalPrice}
          discountPercent={product.discountPercent}
        />
        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => addItem(product)}
          >
            {ui.addToBag}
          </Button>
        </div>
      </div>
    </article>
  );
}
