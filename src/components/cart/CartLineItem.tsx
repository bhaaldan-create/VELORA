"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { getProductBrand } from "@/lib/product-brand";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types";
import {
  IconMinus,
  IconPlus,
  IconTrash,
} from "@/components/cart/CartIcons";

type Props = {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  isLast?: boolean;
};

export function CartLineItem({
  item,
  onUpdateQuantity,
  onRemove,
  isLast,
}: Props) {
  const { product, quantity } = item;
  const [removing, setRemoving] = useState(false);
  const brand = getProductBrand(product.name, product.nameAr);
  const lineTotal = product.price * quantity;

  function handleRemove() {
    setRemoving(true);
    window.setTimeout(() => onRemove(product.id), 180);
  }

  return (
    <li
      className={cn(
        "transition-all duration-200",
        removing ? "scale-[0.98] opacity-0" : "opacity-100",
      )}
    >
      <article className="flex gap-4 py-5 sm:gap-5 sm:py-6">
        <Link
          href={`/shop/${product.slug}`}
          className="group shrink-0 transition-transform duration-200 hover:scale-[1.01] sm:hover:-translate-y-0.5"
        >
          <ProductMedia
            name={product.nameAr}
            imageTone={product.imageTone}
            imageUrl={product.imageUrl}
            aspectClassName="h-[7.5rem] w-[7.5rem] sm:h-[7.75rem] sm:w-[7.75rem]"
            className="rounded-[18px] border border-[var(--plum)]/6 bg-[var(--ivory)]"
            sizes="120px"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className="font-latin t1 font-medium tracking-[0.14em] text-[var(--muted)] uppercase"
                dir="ltr"
              >
                {brand}
              </p>
              <Link
                href={`/shop/${product.slug}`}
                className="font-display mt-1 block text-[1.05rem] font-medium leading-snug text-[var(--ink)] transition-colors hover:text-[var(--plum)]"
              >
                {product.nameAr}
              </Link>
              {product.size ? (
                <p className="t3 mt-1.5 text-[var(--muted)]">{product.size}</p>
              ) : null}
            </div>
            <p className="t4 shrink-0 font-medium text-[var(--plum)]">
              {formatPrice(lineTotal)}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <div
              className="inline-flex h-11 items-center rounded-[12px] border border-[var(--plum)]/12 bg-[var(--surface)]"
              role="group"
              aria-label={`الكمية — ${product.nameAr}`}
            >
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                className="flex h-full w-10 items-center justify-center text-[var(--plum)] transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="تقليل الكمية"
              >
                <IconMinus />
              </button>
              <span
                className="t3 min-w-[2rem] text-center font-medium text-[var(--ink)]"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                className="flex h-full w-10 items-center justify-center text-[var(--plum)] transition-all active:scale-90"
                aria-label="زيادة الكمية"
              >
                <IconPlus />
              </button>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="group inline-flex items-center gap-1.5 t2 text-[var(--muted)] transition-colors hover:text-[var(--plum)]"
              aria-label={`حذف ${product.nameAr}`}
            >
              <IconTrash className="transition-opacity group-hover:opacity-80" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      </article>
      {!isLast ? (
        <div className="h-px bg-[var(--plum)]/8" aria-hidden />
      ) : null}
    </li>
  );
}
