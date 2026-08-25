"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";
import { productCopy } from "./copy";
import { cn } from "@/lib/utils";

export function ProductRoutine({
  current,
  companions,
  ar,
}: {
  current: Product;
  companions: Product[];
  ar: boolean;
}) {
  const copy = productCopy(ar);
  if (!companions.length) return null;

  const steps = [
    { label: copy.routineCurrent, product: current, current: true },
    ...companions.map((p) => ({
      label: copy.routinePair,
      product: p,
      current: false,
    })),
  ];

  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section className="relative mt-14 pt-10 sm:mt-16 sm:pt-12">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--plum)]/15 to-transparent"
        aria-hidden
      />

      <h2 className="font-display text-[1.2rem] font-semibold text-[var(--plum)] sm:text-[1.35rem]">
        {copy.routine}
      </h2>

      <ol className="-mx-1 mt-6 flex items-stretch gap-2 overflow-x-auto px-1 pb-2 admin-scroll sm:mx-0 sm:gap-3 sm:overflow-visible sm:pb-0">
        {steps.map((step, i) => (
          <li key={step.product.id + String(i)} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "w-[9.5rem] rounded-[1.25rem] p-3 sm:w-[11rem]",
                step.current
                  ? "bg-[var(--plum)]/[0.05] ring-1 ring-[var(--plum)]/12"
                  : "bg-[var(--bg-glass)] ring-1 ring-[var(--border)]",
              )}
            >
              <p className="text-[0.62rem] font-medium tracking-[0.14em] text-[var(--muted)]">
                {i + 1} · {step.label}
              </p>
              <div className="mt-2.5 flex gap-2.5">
                <div className="relative h-[4.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-[12px]">
                  <ProductMedia
                    name={step.product.nameAr}
                    imageTone={step.product.imageTone}
                    imageUrl={step.product.imageUrl}
                    aspectClassName="h-full w-full"
                    sizes="70px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {step.current ? (
                    <p className="font-display line-clamp-2 text-[0.75rem] font-semibold leading-snug text-[var(--plum)]">
                      {ar ? step.product.nameAr : step.product.name}
                    </p>
                  ) : (
                    <Link
                      href={`/shop/${step.product.slug}`}
                      className="font-display line-clamp-2 text-[0.75rem] font-semibold leading-snug text-[var(--plum)] hover:underline"
                    >
                      {ar ? step.product.nameAr : step.product.name}
                    </Link>
                  )}
                  <div className="mt-1.5">
                    <ProductPrice
                      size="sm"
                      price={step.product.price}
                      originalPrice={step.product.originalPrice}
                      discountPercent={step.product.discountPercent}
                    />
                  </div>
                </div>
              </div>
            </div>

            {i < steps.length - 1 ? (
              <Arrow
                className="hidden h-4 w-4 shrink-0 text-[var(--plum)]/30 sm:block"
                strokeWidth={1.5}
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function RelatedCard({ product, ar }: { product: Product; ar: boolean }) {
  const { addItem } = useCart();
  const inStock = (product.stock ?? 1) > 0;

  return (
    <article className="relative flex h-full w-[38vw] max-w-[168px] shrink-0 flex-col sm:w-auto sm:max-w-none">
      <WishlistHeartButton
        productId={product.id}
        size="sm"
        className="absolute end-1.5 top-1.5 z-[1] rounded-full border border-[var(--border-glass)] bg-[var(--bg-glass)] p-1.5 shadow-[var(--shadow-sm)] backdrop-blur"
      />
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="overflow-hidden rounded-[1.1rem] ring-1 ring-[var(--border)]">
          <ProductMedia
            name={product.nameAr}
            imageTone={product.imageTone}
            imageUrl={product.imageUrl}
            aspectClassName="aspect-[3/4]"
            className="transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 38vw, 180px"
          />
        </div>
        {product.brandName ? (
          <p
            className="mt-2 truncate text-[0.6rem] tracking-[0.1em] text-[var(--muted)]"
            dir="ltr"
          >
            {product.brandName}
          </p>
        ) : null}
        <h3 className="font-display mt-0.5 line-clamp-2 min-h-[2.4em] text-[0.78rem] font-medium leading-snug text-[var(--plum)]">
          {ar ? product.nameAr : product.name}
        </h3>
      </Link>
      <div className="mt-auto space-y-2 pt-2">
        <ProductPrice
          size="sm"
          price={product.price}
          originalPrice={product.originalPrice}
          discountPercent={product.discountPercent}
        />
        {inStock ? (
          <AddToBagButton
            size="sm"
            flashAdded
            onClick={() => addItem(product, 1)}
          />
        ) : null}
      </div>
    </article>
  );
}

export function ProductRelated({
  products,
  ar,
}: {
  products: Product[];
  ar: boolean;
}) {
  const copy = productCopy(ar);
  if (!products.length) return null;

  return (
    <section className="relative mt-14 pt-10 sm:mt-16 sm:pt-12">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--plum)]/15 to-transparent"
        aria-hidden
      />

      <h2 className="font-display text-[1.2rem] font-semibold text-[var(--plum)] sm:text-[1.35rem]">
        {copy.related}
      </h2>
      <div className="-mx-5 mt-5 flex gap-3 overflow-x-auto px-5 pb-2 admin-scroll sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <RelatedCard key={p.id} product={p} ar={ar} />
        ))}
      </div>
    </section>
  );
}
