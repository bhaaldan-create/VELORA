"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { shopBrands } from "@/data/shop-brands";
import { CompactProductCard } from "@/components/shop/CompactProductCard";
import { useLocale } from "@/context/LocaleContext";
import type { Product } from "@/types";

export function SearchScreen({ products }: { products: Product[] }) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const hay = [
          p.name,
          p.nameAr,
          p.category,
          ...p.concerns,
          ...p.benefits,
          ...p.benefitsAr,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 24);
  }, [products, query]);

  const brandsVisible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shopBrands;
    return shopBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.nameAr.includes(query.trim()) ||
        b.match.some((m) => m.includes(q)),
    );
  }, [query]);

  const searching = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <p className="font-latin text-[11px] font-medium tracking-[0.28em] text-[var(--muted)] uppercase">
          Search
        </p>
        <h1 className="font-display mt-3 text-[clamp(1.65rem,4vw,2.35rem)] font-semibold text-[var(--plum)]">
          {locale === "en" ? "Find your beauty" : "ابحثي عن جمالك"}
        </h1>
      </div>

      {/* بحث يدوي */}
      <label className="relative mt-8 block">
        <span className="sr-only">
          {locale === "en" ? "Search products" : "ابحثي عن منتج"}
        </span>
        <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-[var(--muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M16.2 16.2 21 21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            locale === "en"
              ? "Search product, brand, or need…"
              : "ابحثي عن منتج أو براند أو احتياج…"
          }
          className="font-latin w-full rounded-2xl border border-[var(--plum)]/10 bg-[var(--surface)] py-3.5 ps-11 pe-4 text-[0.95rem] text-[var(--ink)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted)] focus:border-[var(--plum)]/25 focus:shadow-[0_0_0_4px_rgba(61,38,64,0.06)]"
          autoComplete="off"
          inputMode="search"
        />
        {searching ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 end-3 my-auto h-8 rounded-full px-3 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--plum)]"
          >
            {locale === "en" ? "Clear" : "مسح"}
          </button>
        ) : null}
      </label>

      {/* براندات — مربعة بحواف شبه دائرية */}
      <section className="mt-12">
        <h2 className="font-display text-center text-[1.05rem] font-semibold text-[var(--plum)]">
          {locale === "en" ? "Brands" : "البراندات"}
        </h2>
        <div className="mt-7 grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8 md:grid-cols-5">
          {brandsVisible.map((b) => (
            <Link
              key={b.slug}
              href={`/shop?brand=${b.slug}`}
              className="group flex flex-col items-center gap-2.5"
            >
              <span className="relative aspect-square w-[4.5rem] overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_24px_rgba(26,18,28,0.06)] ring-1 ring-[var(--plum)]/8 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_32px_rgba(26,18,28,0.1)] group-hover:ring-[var(--plum)]/16 sm:w-[5.25rem] sm:rounded-[1.5rem]">
                <Image
                  src={b.logo}
                  alt={b.name}
                  fill
                  className="object-contain p-1"
                  sizes="84px"
                  unoptimized
                />
              </span>
              <span className="text-center">
                <span
                  className="font-latin block max-w-[5.75rem] truncate text-[0.7rem] font-semibold tracking-[-0.01em] text-[var(--ink)] sm:max-w-[6.5rem]"
                  dir="ltr"
                >
                  {b.name}
                </span>
                {locale === "ar" ? (
                  <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                    {b.nameAr}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
        {searching && brandsVisible.length === 0 ? (
          <p className="mt-6 text-center text-[0.875rem] text-[var(--muted)]">
            {locale === "en" ? "No matching brands." : "لا يوجد براند مطابق."}
          </p>
        ) : null}
      </section>

      {/* نتائج البحث اليدوي */}
      {searching ? (
        <section className="mt-14">
          <h2 className="font-display text-[1.05rem] font-semibold text-[var(--plum)]">
            {locale === "en"
              ? `Products · ${filtered.length}`
              : `المنتجات · ${filtered.length}`}
          </h2>
          {filtered.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {filtered.map((product) => (
                <CompactProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-[0.9rem] text-[var(--muted)]">
              {locale === "en"
                ? "No products found. Try another word."
                : "لا توجد منتجات. جرّبي كلمة أخرى."}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
