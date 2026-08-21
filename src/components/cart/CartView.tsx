"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { ui } from "@/constants/brand";
import {
  DELIVERY_FEE_IQD,
  getOrderTotal,
} from "@/lib/shipping";
import { DeliveryFeeNotice } from "@/components/shipping/DeliveryFeeNotice";

export function CartView() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const total = getOrderTotal(subtotal, DELIVERY_FEE_IQD);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display t7 font-semibold text-[var(--plum)]">
          {ui.emptyBag}
        </h1>
        <p className="t4 mt-4 text-[var(--muted)]">
          اكتشفي مجموعة VELORA — أو دعي مستشارة الجمال ترشدكِ لطقسكِ الأول.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/shop">
            <Button>{ui.continueShopping}</Button>
          </Link>
          <Link href="/advisor">
            <Button variant="outline">{ui.advisor}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            {ui.bag}
          </p>
          <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
            حقيبة التسوق
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="t2 text-[var(--muted)] hover:text-[var(--plum)]"
        >
          {ui.clear}
        </button>
      </div>

      <ul className="mt-12 divide-y divide-[var(--plum)]/10 border-y border-[var(--plum)]/10">
        {items.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center"
          >
            <ProductMedia
              name={product.nameAr}
              imageTone={product.imageTone}
              imageUrl={product.imageUrl}
              aspectClassName="h-28 w-full sm:h-24 sm:w-20 sm:aspect-auto"
              className="shrink-0"
              sizes="96px"
            />
            <div className="flex-1">
              <Link
                href={`/shop/${product.slug}`}
                className="font-display t5 font-medium text-[var(--plum)]"
              >
                {product.nameAr}
              </Link>
              <p className="t3 mt-1 text-[var(--muted)]">
                <ProductPrice
                  size="sm"
                  price={product.price}
                  originalPrice={product.originalPrice}
                  discountPercent={product.discountPercent}
                />
                <span> · {product.size}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[var(--plum)]/20">
                <button
                  type="button"
                  className="px-3 py-2"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                >
                  −
                </button>
                <span className="t3 min-w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  className="px-3 py-2"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="t3 min-w-[5.5rem] text-end font-medium">
                {formatPrice(product.price * quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(product.id)}
                className="t1 text-[var(--muted)] hover:text-[var(--plum)]"
              >
                {ui.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-stretch justify-between gap-6 sm:flex-row sm:items-center">
        <div className="space-y-3">
          <div>
            <p className="t3 text-[var(--muted)]">{ui.subtotal}</p>
            <p className="font-display t5 mt-1 font-semibold text-[var(--plum)]">
              {formatPrice(subtotal)}
            </p>
          </div>
          <DeliveryFeeNotice feeIqd={DELIVERY_FEE_IQD} compact />
          <div>
            <p className="t3 text-[var(--muted)]">{ui.total}</p>
            <p className="font-display t6 mt-1 font-semibold text-[var(--plum)]">
              {formatPrice(total)}
            </p>
          </div>
        </div>
        <Link href="/checkout">
          <Button className="w-full sm:min-w-[220px]">{ui.checkout}</Button>
        </Link>
      </div>
    </div>
  );
}
