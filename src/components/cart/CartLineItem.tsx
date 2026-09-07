"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { storefrontProductCardImageUrl } from "@/lib/catalog-mapper";
import { getProductBrand } from "@/lib/product-brand";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types";
import {
  IconMinus,
  IconPlus,
  IconTrash,
} from "@/components/cart/CartIcons";
import "./cart-bag.css";

type Props = {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  isLast?: boolean;
};

function resolveCartImageUrl(product: CartItem["product"]) {
  const stored = product.imageUrl?.trim();
  if (stored) return stored;
  return storefrontProductCardImageUrl(product.id);
}

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
  const imageUrl = resolveCartImageUrl(product);
  const hasDiscount =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;

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
      <article className="bag-line">
        <Link href={`/shop/${product.slug}`} className="bag-line__media">
          <ProductMedia
            name={product.nameAr}
            imageTone={product.imageTone}
            imageUrl={imageUrl}
            aspectClassName="h-full w-full"
            className="!h-full !w-full"
            /* Cover + slight scale: bag thumbnail only — shop/PDP stay contain */
            imageClassName="bag-line__photo"
            fit="cover"
            sizes="140px"
          />
        </Link>

        <div className="bag-line__body">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="bag-line__brand" dir="ltr">
                {brand}
              </p>
              <Link href={`/shop/${product.slug}`} className="bag-line__name">
                {product.nameAr}
              </Link>
              {product.size ? (
                <p className="bag-line__size">{product.size}</p>
              ) : null}
            </div>
            <p className="bag-line__price font-price">
              {formatPrice(lineTotal)}
              {hasDiscount ? (
                <span className="bag-line__price-was font-price">
                  {formatPrice((product.originalPrice as number) * quantity)}
                </span>
              ) : null}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <div
              className="bag-qty"
              role="group"
              aria-label={`الكمية — ${product.nameAr}`}
            >
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                aria-label="تقليل الكمية"
              >
                <IconMinus />
              </button>
              <span className="bag-qty__value" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                aria-label="زيادة الكمية"
              >
                <IconPlus />
              </button>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="bag-remove"
              aria-label={`حذف ${product.nameAr}`}
            >
              <IconTrash />
            </button>
          </div>
        </div>
      </article>
      {!isLast ? <div className="bag-divider" aria-hidden /> : null}
    </li>
  );
}
