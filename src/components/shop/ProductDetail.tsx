"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { IconWhatsApp } from "@/components/contact/SocialIcons";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { getProductWhatsAppUrl } from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { ProductBrandLogo, ProductHeroImage } from "./product-detail/ProductHeroImage";
import { ProductRelated, ProductRoutine } from "./product-detail/ProductRails";
import {
  ProductAbout,
  ProductBenefits,
  ProductIngredients,
  ProductLarsaCard,
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
        "inline-flex items-center rounded-full border border-[var(--plum)]/15 bg-white",
        compact ? "h-10" : "h-12",
      )}
      role="group"
      aria-label={copy.qty}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-[var(--plum)] transition active:scale-95",
          compact ? "h-10 w-10" : "h-12 w-11",
        )}
        onClick={() => setQty(Math.max(1, qty - 1))}
        aria-label={copy.decrease}
      >
        −
      </button>
      <span
        className={cn(
          "min-w-7 text-center font-medium text-[var(--plum)]",
          compact ? "text-[0.85rem]" : "text-[0.95rem]",
        )}
      >
        {qty}
      </span>
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-[var(--plum)] transition active:scale-95",
          compact ? "h-10 w-10" : "h-12 w-11",
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
  const [showSticky, setShowSticky] = useState(false);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const waProductUrl = getProductWhatsAppUrl(product, ar ? "ar" : "en");
  const inStock = (product.stock ?? 1) > 0;

  const handleAdd = () => {
    if (!inStock) return;
    addItem(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  useEffect(() => {
    const el = purchaseRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { rootMargin: "-40px 0px 0px 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--pdp-sticky-offset",
      showSticky ? "4.75rem" : "0px",
    );
    return () => {
      document.documentElement.style.removeProperty("--pdp-sticky-offset");
    };
  }, [showSticky]);

  return (
    <div className="bg-[var(--ivory)] pb-[calc(6.5rem+var(--pdp-sticky-offset,0px)+env(safe-area-inset-bottom))] lg:pb-20">
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 sm:pt-10 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">
          <ProductHeroImage product={product} ar={ar} />

          <div className="motion-safe:animate-[velora-rise_0.85s_0.08s_ease-out_both]">
            <ProductBrandLogo
              brandName={product.brandName}
              brandLogoUrl={product.brandLogoUrl}
            />

            <h1 className="font-display text-[clamp(1.45rem,4.2vw,2.1rem)] font-semibold leading-[1.25] text-[var(--plum)]">
              {ar ? product.nameAr : product.name}
            </h1>
            <p
              className="mt-2 text-[0.9rem] leading-relaxed text-[var(--muted)]"
              dir={ar ? "ltr" : undefined}
            >
              {ar ? product.name : product.nameAr}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.82rem] text-[var(--muted)]">
              {product.reviews > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[var(--plum)]">
                    <span aria-hidden>★</span>
                    <span className="font-medium">
                      {product.rating.toFixed(1)}
                    </span>
                  </span>
                  <span>
                    {product.reviews.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
                    {copy.reviews}
                  </span>
                </>
              ) : (
                <span>{copy.noReviews}</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <ProductPrice
                size="lg"
                price={product.price}
                originalPrice={product.originalPrice}
                discountPercent={product.discountPercent}
              />
              {product.size ? (
                <span className="mb-1 text-[0.8rem] text-[var(--muted)]">
                  {product.size}
                </span>
              ) : null}
            </div>

            <ProductBenefits product={product} ar={ar} />

            <div ref={purchaseRef} className="mt-9 space-y-3">
              {inStock ? (
                <div className="flex flex-wrap items-center gap-3">
                  <QtyControl qty={qty} setQty={setQty} ar={ar} />
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[var(--plum)] px-6 text-[0.88rem] font-medium text-white transition hover:bg-[var(--plum-soft)] active:scale-[0.98] sm:flex-none sm:min-w-[200px]"
                  >
                    {added ? copy.added : copy.addToBag}
                  </button>
                </div>
              ) : (
                <p className="inline-flex min-h-12 items-center rounded-full border border-[var(--plum)]/15 bg-[var(--mist)] px-5 text-[0.88rem] font-medium text-[var(--muted)]">
                  {copy.outOfStock}
                </p>
              )}

              {waProductUrl ? (
                <a
                  href={waProductUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--plum)]/15 bg-white px-5 text-[0.85rem] font-medium text-[var(--plum)] transition hover:bg-[var(--mist)]/70 sm:w-auto sm:min-w-[200px]"
                  aria-label={copy.orderWhatsApp}
                >
                  <IconWhatsApp size={16} className="text-[#3d8b6e]" />
                  {copy.orderWhatsApp}
                </a>
              ) : null}
            </div>

            <ProductAbout product={product} ar={ar} />
            <ProductIngredients product={product} ar={ar} />
            <ProductSuitability product={product} ar={ar} />
            <ProductLarsaCard ar={ar} />
          </div>
        </div>

        <ProductRoutine current={product} companions={routine} ar={ar} />
        <ProductRelated products={related} ar={ar} />
      </div>

      {/* Sticky purchase bar — mobile */}
      <div
        className={cn(
          "fixed inset-x-0 z-40 border-t border-[var(--plum)]/10 bg-[var(--ivory)]/95 px-4 py-3 backdrop-blur-xl transition-all duration-300 lg:hidden",
          "bottom-[calc(4.35rem+env(safe-area-inset-bottom))]",
          showSticky && inStock
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!showSticky || !inStock}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <ProductPrice
              size="sm"
              price={product.price}
              originalPrice={product.originalPrice}
              discountPercent={product.discountPercent}
            />
          </div>
          <QtyControl qty={qty} setQty={setQty} ar={ar} compact />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[var(--plum)] px-4 text-[0.78rem] font-medium text-white active:scale-[0.98]"
          >
            {added ? copy.added : copy.addToBag}
          </button>
        </div>
      </div>
    </div>
  );
}
