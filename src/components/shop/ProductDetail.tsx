"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { ProductWhatsAppButton } from "@/components/shop/ProductWhatsAppButton";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { isProductInStock } from "@/lib/inventory";
import { getProductWhatsAppUrl } from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { ProductGallery } from "./product-detail/ProductGallery";
import { ProductRelated, ProductRoutine } from "./product-detail/ProductRails";
import {
  ProductAbout,
  ProductBenefits,
  ProductDetails,
  ProductIngredients,
  ProductLarsaCard,
  ProductRatingRow,
  ProductSuitability,
} from "./product-detail/ProductSections";
import { isPresentValue, productCopy } from "./product-detail/copy";
import "./product-detail/product-detail.css";

type Props = {
  product: Product;
  related: Product[];
  routine: Product[];
};

function QtyControl({
  qty,
  setQty,
  ar,
  compact,
}: {
  qty: number;
  setQty: (n: number) => void;
  ar: boolean;
  compact?: boolean;
}) {
  const copy = productCopy(ar);
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--plum)]/12 bg-white/90",
        compact ? "h-9" : "h-11",
      )}
      role="group"
      aria-label={copy.qty}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-[var(--plum)] transition active:scale-95",
          compact ? "h-9 w-9" : "h-11 w-10",
        )}
        onClick={() => setQty(Math.max(1, qty - 1))}
        aria-label={copy.decrease}
      >
        −
      </button>
      <span
        className={cn(
          "min-w-6 text-center font-medium tabular-nums text-[var(--plum)]",
          compact ? "text-[0.8rem]" : "text-[0.88rem]",
        )}
      >
        {qty}
      </span>
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-[var(--plum)] transition active:scale-95",
          compact ? "h-9 w-9" : "h-11 w-10",
        )}
        onClick={() => setQty(qty + 1)}
        aria-label={copy.increase}
      >
        +
      </button>
    </div>
  );
}

function StickyPurchaseBar({
  product,
  qty,
  setQty,
  ar,
  added,
  onAdd,
}: {
  product: Product;
  qty: number;
  setQty: (n: number) => void;
  ar: boolean;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="pdp-sticky-bar">
      <div className="mx-auto flex max-w-lg items-center gap-2.5">
        <div className="min-w-0 shrink-0">
          <ProductPrice
            size="sm"
            price={product.price}
            originalPrice={product.originalPrice}
            discountPercent={product.discountPercent}
            className="[&>span:first-child]:text-[0.95rem] [&>span:first-child]:font-semibold [&>span:first-child]:text-[var(--plum)]"
          />
        </div>
        <QtyControl qty={qty} setQty={setQty} ar={ar} compact />
        <AddToBagButton
          size="compact"
          added={added}
          onClick={onAdd}
          className="min-w-0 flex-1"
        />
      </div>
    </div>
  );
}

export function ProductDetail({ product, related, routine }: Props) {
  const { addItem } = useCart();
  const { locale } = useLocale();
  const ar = locale !== "en";
  const copy = productCopy(ar);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const waProductUrl = getProductWhatsAppUrl(product, ar ? "ar" : "en");
  const inStock = isProductInStock(product);
  const brand = product.brandName?.trim();
  const hasBrand = isPresentValue(brand);

  const handleAdd = () => {
    if (!inStock) return;
    addItem(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      document.documentElement.style.setProperty(
        "--pdp-sticky-offset",
        mq.matches && inStock ? "4.75rem" : "0px",
      );
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.removeProperty("--pdp-sticky-offset");
    };
  }, [inStock]);

  const purchaseBlock = (
    <div className="space-y-3">
      {inStock ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <QtyControl qty={qty} setQty={setQty} ar={ar} />
          <AddToBagButton
            size="lg"
            added={added}
            onClick={handleAdd}
            className="sm:flex-1"
          />
        </div>
      ) : (
        <p className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c45a5a]/28 bg-[linear-gradient(145deg,#c45a5a,#a63d45)] px-6 text-[0.88rem] font-medium tracking-[0.08em] text-[#fff8f7] shadow-[0_10px_24px_-12px_rgba(166,61,69,0.55)]">
          {copy.outOfStock}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-[var(--ivory)] pb-[calc(6.25rem+var(--pdp-sticky-offset,0px)+env(safe-area-inset-bottom))] lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8 sm:pt-10 lg:pt-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
          <ProductGallery product={product} ar={ar} />

          <div className="motion-safe:animate-[velora-rise_0.8s_0.06s_ease-out_both]">
            {hasBrand ? (
              <p
                className="text-[0.72rem] font-medium tracking-[0.18em] text-[var(--plum)]/55"
                dir="ltr"
              >
                {brand}
              </p>
            ) : null}

            <h1
              className={cn(
                "font-display text-[clamp(1.4rem,4.2vw,2rem)] font-bold leading-[1.22] tracking-[-0.015em] text-[var(--plum)]",
                hasBrand ? "mt-1.5" : "mt-0",
              )}
            >
              {ar ? product.nameAr : product.name}
            </h1>

            <p
              className="mt-1.5 text-[0.84rem] font-light leading-relaxed tracking-[0.01em] text-[var(--muted)]"
              dir={ar ? "ltr" : undefined}
            >
              {ar ? product.name : product.nameAr}
            </p>

            <ProductRatingRow product={product} ar={ar} />

            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1.5">
              <ProductPrice
                size="lg"
                layout="editorial"
                price={product.price}
                originalPrice={product.originalPrice}
                discountPercent={product.discountPercent}
              />
              {isPresentValue(product.size) ? (
                <span className="mb-1.5 text-[0.78rem] tracking-[0.02em] text-[var(--muted)]">
                  {product.size}
                </span>
              ) : null}
            </div>

            <ProductBenefits product={product} ar={ar} />

            {/* WhatsApp — primary conversion CTA */}
            {waProductUrl ? (
              <div className="mt-7">
                <ProductWhatsAppButton
                  href={waProductUrl}
                  label={copy.orderWhatsApp}
                  hint={copy.orderWhatsAppHint}
                  variant="hero"
                />
              </div>
            ) : null}

            {/* Desktop purchase under WhatsApp; mobile uses sticky bar */}
            <div className="mt-5 hidden lg:block">{purchaseBlock}</div>

            <ProductAbout product={product} ar={ar} />
            <ProductIngredients product={product} ar={ar} />
            <ProductSuitability product={product} ar={ar} />
            <ProductDetails product={product} ar={ar} />
            <ProductLarsaCard ar={ar} />
          </div>
        </div>

        <ProductRoutine current={product} companions={routine} ar={ar} />
        <ProductRelated products={related} ar={ar} />
      </div>

      {inStock ? (
        <StickyPurchaseBar
          product={product}
          qty={qty}
          setQty={setQty}
          ar={ar}
          added={added}
          onAdd={handleAdd}
        />
      ) : null}
    </div>
  );
}
