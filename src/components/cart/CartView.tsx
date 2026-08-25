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
    <div className="bg-[var(--ivory)] pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--plum)]/8 pb-5">
          <div className="min-w-0">
            <p className="t1 font-medium tracking-[0.22em] text-[var(--muted)]">
              {ui.bag}
            </p>
            <h1 className="font-display mt-1 text-[clamp(1.5rem,3.5vw,2rem)] font-medium leading-tight text-[var(--plum)]">
              حقيبة التسوق
            </h1>
            <p className="t3 mt-1 text-[var(--muted)]">
              {formatBagCount(itemCount)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="t2 shrink-0 pt-1 font-medium tracking-[0.04em] text-[var(--muted)] transition-colors hover:text-[var(--plum)]"
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

          <div className="hidden lg:block lg:sticky lg:top-24">
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

      <div
        className="fixed inset-x-0 z-40 border-t border-[var(--plum)]/10 bg-[var(--bg-glass-strong)] shadow-[0_-8px_30px_-12px_rgba(61,38,64,0.15)] backdrop-blur-sm lg:hidden"
        style={{
          bottom: "calc(4.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="t2 text-[var(--muted)]">الإجمالي</p>
            <p className="font-price text-[1.2rem] font-semibold text-[var(--plum)]">
              {formatPrice(total)}
            </p>
          </div>
          <Link
            href="/checkout"
            className="t3 inline-flex min-w-[9.5rem] flex-1 items-center justify-center gap-2 rounded-[14px] bg-[var(--plum)] px-5 py-3 font-medium text-[var(--ivory)] shadow-[0_4px_16px_-6px_rgba(61,38,64,0.4)] transition-all active:scale-[0.99] sm:max-w-[220px] sm:flex-none"
          >
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
