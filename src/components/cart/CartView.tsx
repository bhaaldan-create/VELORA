"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ui } from "@/constants/brand";
import { CartClearDialog } from "@/components/cart/CartClearDialog";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { IconArrowStart } from "@/components/cart/CartIcons";
import { formatPrice } from "@/lib/utils";
import {
  DELIVERY_FEE_IQD,
  getOrderTotal,
} from "@/lib/shipping";
import "./cart-bag.css";

function formatBagCount(count: number) {
  if (count === 1) return "1 منتج";
  if (count === 2) return "2 منتجات";
  return `${count} منتجات`;
}

export function CartView() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();
  const [clearOpen, setClearOpen] = useState(false);
  const deliveryFee = DELIVERY_FEE_IQD;
  const total = getOrderTotal(subtotal, deliveryFee);

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="velora-bag bag-shell">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        <header className="bag-header">
          <div className="min-w-0">
            <p className="bag-header__eyebrow">{ui.bag}</p>
            <h1 className="bag-header__title">حقيبة التسوق</h1>
            <p className="bag-header__meta">{formatBagCount(itemCount)}</p>
          </div>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="bag-clear"
          >
            تفريغ
          </button>
        </header>

        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label="منتجات الحقيبة">
            <ul>
              {items.map(({ product, quantity }, index) => (
                <CartLineItem
                  key={product.id}
                  item={{ product, quantity }}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  isLast={index === items.length - 1}
                />
              ))}
            </ul>
          </section>

          <div className="hidden lg:block lg:sticky lg:top-[calc(var(--header-offset)+1rem)]">
            <CartOrderSummary
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
            />
          </div>
        </div>

        <div className="mt-8 lg:hidden">
          <CartOrderSummary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            showCta={false}
          />
        </div>
      </div>

      <div className="bag-sticky" role="region" aria-label="إتمام الطلب">
        <div className="bag-sticky__inner">
          <div>
            <p className="bag-sticky__label">الإجمالي</p>
            <p className="bag-sticky__total font-price">{formatPrice(total)}</p>
          </div>
          <Link href="/checkout" className="bag-sticky__cta">
            <span>إتمام الطلب</span>
            <IconArrowStart />
          </Link>
        </div>
      </div>

      <CartClearDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={clearCart}
      />
    </div>
  );
}
