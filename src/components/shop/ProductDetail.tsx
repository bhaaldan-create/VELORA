"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { ProductWhatsAppButton } from "@/components/shop/ProductWhatsAppButton";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { getProductWhatsAppUrl } from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { ProductHeroImage } from "./product-detail/ProductHeroImage";
import { ProductRelated, ProductRoutine } from "./product-detail/ProductRails";
import {
  ProductAbout,
  ProductBenefits,
  ProductIngredients,
  ProductLarsaCard,
  ProductMicroTags,
  ProductSuitability,
} from "./product-detail/ProductSections";
import { productCopy } from "./product-detail/copy";

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
          "min-w-6 text-center font-medium text-[var(--plum)]",
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

export function ProductDetail({ product, related, routine }: Props) {
  const { addItem } = useCart();
  const { locale } = useLocale();
  const ar = locale !== "en";
  const copy = productCopy(ar);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const waProductUrl = getProductWhatsAppUrl(product, ar ? "ar" : "en");
  const inStock = (product.stock ?? 1) > 0;

  const handleAdd = () => {
    if (!inStock) return;
    addItem(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  /* Mobile sticky CTA is always docked — reserve bottom space so content never jumps. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      document.documentElement.style.setProperty(
        "--pdp-sticky-offset",
        mq.matches && inStock ? "4.5rem" : "0px",
      );
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.removeProperty("--pdp-sticky-offset");
    };
  }, [inStock]);

  return (
    <div className="bg-[var(--ivory)] pb-[calc(6.25rem+var(--pdp-sticky-offset,0px)+env(safe-area-inset-bottom))] lg:pb-20">
      <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-8 sm:pt-10 lg:pt-12">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start lg:gap-14 xl:gap-16">
          {/* Hero column: image + brand logo signature */}
          <ProductHeroImage product={product} ar={ar} />

          {/* Editorial product story */}
          <div className="motion-safe:animate-[velora-rise_0.8s_0.06s_ease-out_both]">
            <h1 className="font-display line-clamp-2 min-h-[calc(1.28em*2)] text-[clamp(1.35rem,3.8vw,1.95rem)] font-bold leading-[1.28] tracking-[-0.01em] text-[var(--plum)]">
              {ar ? product.nameAr : product.name}
            </h1>
            <p
              className="font-display mt-1.5 line-clamp-1 text-[0.82rem] font-light leading-relaxed tracking-[0.01em] text-[var(--muted)]"
              dir={ar ? "ltr" : undefined}
            >
              {ar ? product.name : product.nameAr}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.78rem] text-[var(--muted)]">
              {product.reviews > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[var(--plum)]">
                    <span aria-hidden className="text-[0.85rem]">
                      ★
                    </span>
                    <span className="font-medium tabular-nums">
                      {product.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="text-[var(--plum)]/25" aria-hidden>
                    ·
                  </span>
                  <span>
                    {product.reviews.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
                    {copy.reviews}
                  </span>
                  <span className="text-[var(--plum)]/25" aria-hidden>
                    ·
                  </span>
                  <a
                    href="#reviews"
                    className="text-[var(--plum)]/70 underline-offset-4 transition hover:text-[var(--plum)] hover:underline"
                  >
                    {copy.viewReviews}
                  </a>
                </>
              ) : (
                <span>{copy.noReviews}</span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-2.5">
              <ProductPrice
                size="lg"
                price={product.price}
                originalPrice={product.originalPrice}
                discountPercent={product.discountPercent}
                className="[&>span:first-child]:text-[1.35rem] [&>span:first-child]:font-semibold [&>span:first-child]:text-[var(--plum)] sm:[&>span:first-child]:text-[1.5rem]"
              />
              {product.size ? (
                <span className="mb-1 text-[0.75rem] tracking-[0.02em] text-[var(--muted)]">
                  {product.size}
                </span>
              ) : null}
            </div>

            {/* Purchase stays directly under price so length of benefits/tags never shifts it */}
            <div className="mt-7 hidden space-y-3 lg:block">
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
                <p className="inline-flex min-h-11 items-center rounded-full border border-[var(--plum)]/12 bg-[var(--mist)]/80 px-5 text-[0.84rem] font-medium text-[var(--muted)]">
                  {copy.outOfStock}
                </p>
              )}

              {waProductUrl ? (
                <ProductWhatsAppButton
                  href={waProductUrl}
                  label={copy.orderWhatsApp}
                />
              ) : null}
            </div>

            {/* Mobile: docked sticky CTA only — keep WhatsApp reachable in-flow */}
            {waProductUrl ? (
              <div className="mt-7 lg:hidden">
                <ProductWhatsAppButton
                  href={waProductUrl}
                  label={copy.orderWhatsApp}
                />
              </div>
            ) : null}

            <ProductMicroTags product={product} ar={ar} />
            <ProductBenefits product={product} ar={ar} />
            <ProductAbout product={product} ar={ar} />
            <ProductIngredients product={product} ar={ar} />
            <ProductSuitability product={product} ar={ar} />
            <ProductLarsaCard ar={ar} />
          </div>
        </div>

        <ProductRoutine current={product} companions={routine} ar={ar} />
        <ProductRelated products={related} ar={ar} />
      </div>

      {/* Sticky purchase — mobile: always docked above bottom nav */}
      {inStock ? (
        <div
          className="fixed inset-x-0 z-40 border-t border-[var(--plum)]/8 bg-[var(--bg-glass-strong)] px-4 py-2.5 backdrop-blur-xl lg:hidden bottom-[calc(4.15rem+env(safe-area-inset-bottom))]"
          style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <div className="min-w-0 shrink-0">
              <ProductPrice
                size="sm"
                price={product.price}
                originalPrice={product.originalPrice}
                discountPercent={product.discountPercent}
              />
            </div>
            <QtyControl qty={qty} setQty={setQty} ar={ar} compact />
            <AddToBagButton
              size="compact"
              added={added}
              onClick={handleAdd}
              className="min-w-0 flex-1"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
