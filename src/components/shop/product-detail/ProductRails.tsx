"use client";

import Link from "next/link";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
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

  return (
    <section className="mt-14 border-t border-[var(--plum)]/8 pt-10">
      <h2 className="font-display text-[1.2rem] font-semibold text-[var(--plum)] sm:text-[1.35rem]">
        {copy.routine}
      </h2>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.product.id + String(i)}
            className={cn(
              "rounded-[22px] border border-[var(--plum)]/8 bg-white/80 p-4",
              step.current && "ring-1 ring-[var(--plum)]/15",
            )}
          >
            <p className="text-[0.68rem] font-medium tracking-[0.14em] text-[var(--muted)]">
              {i + 1} — {step.label}
            </p>
            <div className="mt-3 flex gap-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[14px]">
                <ProductMedia
                  name={step.product.nameAr}
                  imageTone={step.product.imageTone}
                  imageUrl={step.product.imageUrl}
                  aspectClassName="h-full w-full"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0">
                {step.current ? (
                  <p className="truncate text-[0.85rem] font-semibold text-[var(--plum)]">
                    {ar ? step.product.nameAr : step.product.name}
                  </p>
                ) : (
                  <Link
                    href={`/shop/${step.product.slug}`}
                    className="truncate text-[0.85rem] font-semibold text-[var(--plum)] hover:underline"
                  >
                    {ar ? step.product.nameAr : step.product.name}
                  </Link>
                )}
                <div className="mt-1">
                  <ProductPrice
                    size="sm"
                    price={step.product.price}
                    originalPrice={step.product.originalPrice}
                    discountPercent={step.product.discountPercent}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
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
    <section className="mt-14 border-t border-[var(--plum)]/8 pt-10">
      <h2 className="font-display text-[1.2rem] font-semibold text-[var(--plum)] sm:text-[1.35rem]">
        {copy.related}
      </h2>
      <div className="-mx-5 mt-6 flex gap-3 overflow-x-auto px-5 pb-2 admin-scroll sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <article
            key={p.id}
            className="relative w-[42vw] max-w-[200px] shrink-0 sm:w-auto sm:max-w-none"
          >
            <WishlistHeartButton
              productId={p.id}
              className="absolute end-2 top-2 z-[1] rounded-full bg-white/90 p-2 shadow-sm backdrop-blur"
            />
            <Link href={`/shop/${p.slug}`} className="group block">
              <div className="overflow-hidden rounded-[20px] bg-[var(--mist)]">
                <ProductMedia
                  name={p.nameAr}
                  imageTone={p.imageTone}
                  imageUrl={p.imageUrl}
                  aspectClassName="aspect-[3/4]"
                  className="transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 42vw, 220px"
                />
              </div>
              {p.brandName ? (
                <p
                  className="mt-2.5 truncate text-[0.65rem] tracking-[0.08em] text-[var(--muted)]"
                  dir="ltr"
                >
                  {p.brandName}
                </p>
              ) : null}
              <h3 className="mt-1 line-clamp-2 text-[0.82rem] font-medium leading-snug text-[var(--plum)]">
                {ar ? p.nameAr : p.name}
              </h3>
              <div className="mt-1.5">
                <ProductPrice
                  size="sm"
                  price={p.price}
                  originalPrice={p.originalPrice}
                  discountPercent={p.discountPercent}
                />
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
