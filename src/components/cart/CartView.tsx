"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ui } from "@/constants/brand";
import { CartClearDialog } from "@/components/cart/CartClearDialog";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { CouponAppliedCeremony } from "@/components/cart/CouponAppliedCeremony";
import { CouponField } from "@/components/cart/CouponField";
import { couponDisplayPercent, useCouponQuote } from "@/components/cart/useCouponQuote";
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
  const [rite, setRite] = useState(false);
  const awaiting = useRef(false);
  const coupon = useCouponQuote({
    items: items.map(({ product, quantity }) => ({ id: product.id, quantity })),
  });
  const productDiscount = items.reduce((sum, { product, quantity }) => {
    const base =
      product.originalPrice && product.originalPrice > product.price
        ? product.originalPrice
        : product.price;
    return sum + (base - product.price) * quantity;
  }, 0);
  useLayoutEffect(() => {
    if (!awaiting.current || coupon.loading) return;
    awaiting.current = false;
    if (coupon.quote && !coupon.error) setRite(true);
  }, [coupon.loading, coupon.quote, coupon.error]);

  function applyCoupon() {
    if (!coupon.code.trim() || coupon.loading) return;
    awaiting.current = true;
    coupon.apply();
  }

  const shownPercent = couponDisplayPercent(coupon.quote);
  const deliveryFee = coupon.quote?.deliveryFee ?? DELIVERY_FEE_IQD;
  const saleSubtotal = coupon.quote?.merchandiseSubtotal ?? subtotal;
  const total = coupon.quote?.total ?? getOrderTotal(subtotal, deliveryFee);

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
            <div className="space-y-4">
              <CouponField
                id="coupon-code-desktop"
                code={coupon.code}
                applied={coupon.applied}
                error={coupon.error}
                loading={coupon.loading}
                discountPercent={shownPercent}
                discountIqd={coupon.quote?.couponDiscountIqd}
                onChange={coupon.setCode}
                onApply={applyCoupon}
                onClear={() => {
                  setRite(false);
                  coupon.clear();
                }}
              />
              <CartOrderSummary
                subtotal={saleSubtotal}
                deliveryFee={deliveryFee}
                total={total}
                couponCode={coupon.quote?.couponCode}
                couponDiscount={coupon.quote?.couponDiscountIqd}
                discountPercent={shownPercent}
                productDiscount={coupon.quote?.productDiscountIqd || productDiscount}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 lg:hidden">
          <div className="space-y-4">
            <CouponField
              id="coupon-code-mobile"
              code={coupon.code}
              applied={coupon.applied}
              error={coupon.error}
              loading={coupon.loading}
              discountPercent={shownPercent}
              discountIqd={coupon.quote?.couponDiscountIqd}
              onChange={coupon.setCode}
              onApply={applyCoupon}
              onClear={() => {
                setRite(false);
                coupon.clear();
              }}
            />
            <CartOrderSummary
              subtotal={saleSubtotal}
              deliveryFee={deliveryFee}
              total={total}
              couponCode={coupon.quote?.couponCode}
              couponDiscount={coupon.quote?.couponDiscountIqd}
              discountPercent={shownPercent}
              productDiscount={coupon.quote?.productDiscountIqd || productDiscount}
              showCta={false}
            />
          </div>
        </div>
      </div>

      <CouponAppliedCeremony
        open={rite}
        percent={shownPercent}
        onDone={() => setRite(false)}
      />

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
