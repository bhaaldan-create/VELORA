"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  brandCountries,
  shopBrands,
  type ShopBrandCountryCode,
} from "@/data/shop-brands";
import { BrandCard } from "@/components/shop/BrandCard";
import { CompactProductCard } from "@/components/shop/CompactProductCard";
import { useLocale } from "@/context/LocaleContext";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export function SearchScreen() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<ShopBrandCountryCode | "all">("all");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/catalog/search?q=${encodeURIComponent(q)}`,
          );
          const data = (await res.json()) as {
            ok?: boolean;
            products?: Product[];
          };
          setResults(data.ok && Array.isArray(data.products) ? data.products : []);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query]);

  const brandsVisible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shopBrands.filter((b) => {
      if (country !== "all" && b.countryCode !== country) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.nameAr.includes(query.trim()) ||
        b.countryAr.includes(query.trim()) ||
        b.country.toLowerCase().includes(q) ||
        b.match.some((m) => m.includes(q))
      );
    });
  }, [query, country]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Header row */}
      <div className="relative z-[1] flex items-center gap-3">
        <Link
          href="/"
          aria-label={ar ? "رجوع" : "Back"}
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "border border-white/80 bg-white/70 text-[var(--plum)] shadow-[0_8px_22px_-12px_rgba(61,36,63,0.28)]",
            "backdrop-blur-md transition-transform duration-200 hover:scale-[1.03] active:scale-95",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d={ar ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">
            {ar ? "ابحثي عن براند" : "Search for a brand"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-[var(--plum)]/45">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.45" />
              <path
                d="M16.2 16.2 21 21"
                stroke="currentColor"
                strokeWidth="1.45"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "ابحثي عن براند" : "Search for a brand"}
            className={cn(
              "w-full rounded-full border border-white/80 bg-white/70 py-3 ps-11 pe-12",
              "text-[0.92rem] text-[#2a1a2c] shadow-[0_10px_28px_-18px_rgba(61,36,63,0.28)]",
              "outline-none backdrop-blur-md placeholder:text-[#8a7588]/80",
              "transition-[box-shadow,border-color] duration-200",
              "focus:border-[var(--plum)]/20 focus:shadow-[0_0_0_4px_rgba(149,120,168,0.12)]",
            )}
            autoComplete="off"
            inputMode="search"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 end-3 my-auto h-7 rounded-full px-2.5 text-[11px] font-medium text-[#8a7588] hover:text-[var(--plum)]"
            >
              {ar ? "مسح" : "Clear"}
            </button>
          ) : null}
        </label>
      </div>

      {/* Title */}
      <header className="relative z-[1] mt-10 text-center sm:mt-12">
        <h1 className="font-display text-[clamp(1.85rem,5vw,2.65rem)] font-bold tracking-[-0.02em] text-[#3D243F]">
          {ar ? "البراندات" : "Brands"}
        </h1>
        <p className="mx-auto mt-2.5 max-w-md text-[0.92rem] leading-relaxed text-[#8a7588]">
          {ar
            ? "تسوّقي من أفضل العلامات التجارية العالمية"
            : "Shop the world’s finest beauty houses"}
        </p>
        <div className="mx-auto mt-5 flex max-w-[11rem] items-center gap-2" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--plum)]/25" />
          <svg width="10" height="10" viewBox="0 0 12 12" className="text-[var(--plum)]/55">
            <path
              d="M6 0.6 6.85 4.2 10.5 5.05 6.85 5.9 6 9.5 5.15 5.9 1.5 5.05 5.15 4.2 6 0.6Z"
              fill="currentColor"
            />
          </svg>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--plum)]/25" />
        </div>
      </header>

      {/* Country chips */}
      <div className="relative z-[1] mt-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setCountry("all")}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-[0.75rem] font-medium transition-all duration-200",
            country === "all"
              ? "border-[var(--plum)]/20 bg-[var(--plum)] text-white shadow-[0_8px_20px_-12px_rgba(61,36,63,0.45)]"
              : "border-white/80 bg-white/55 text-[#5c4560] backdrop-blur-sm hover:bg-white/80",
          )}
        >
          {ar ? "الكل" : "All"}
        </button>
        {brandCountries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCountry(c.code)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.75rem] font-medium transition-all duration-200",
              country === c.code
                ? "border-[var(--plum)]/20 bg-[var(--plum)] text-white shadow-[0_8px_20px_-12px_rgba(61,36,63,0.45)]"
                : "border-white/80 bg-white/55 text-[#5c4560] backdrop-blur-sm hover:bg-white/80",
            )}
          >
            <span className="text-[0.85rem] opacity-90" aria-hidden>
              {c.flag}
            </span>
            <span>{ar ? c.nameAr : c.name}</span>
          </button>
        ))}
      </div>

      {/* Brand grid */}
      <section className="relative z-[1] mt-8">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
          {brandsVisible.map((b) => (
            <BrandCard key={b.id} brand={b} locale={ar ? "ar" : "en"} />
          ))}
        </div>
        {brandsVisible.length === 0 ? (
          <p className="mt-10 text-center text-[0.9rem] text-[#8a7588]">
            {ar ? "لا يوجد براند مطابق." : "No matching brands."}
          </p>
        ) : (
          <p className="mt-6 text-center font-latin text-[0.7rem] tracking-[0.12em] text-[#8a7588]/70 uppercase">
            {brandsVisible.length} {ar ? "براند" : "brands"}
          </p>
        )}
      </section>

      {hasQuery ? (
        <section className="relative z-[1] mt-14">
          <h2 className="font-display text-center text-[1.1rem] font-semibold text-[#3D243F]">
            {searching
              ? ar
                ? "جارٍ البحث…"
                : "Searching…"
              : ar
                ? `المنتجات · ${results.length}`
                : `Products · ${results.length}`}
          </h2>
          {searching ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-[1.5rem] bg-white/50"
                />
              ))}
            </div>
          ) : results.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {results.map((product) => (
                <CompactProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-[0.9rem] text-[#8a7588]">
              {ar
                ? "لا توجد منتجات. جرّبي كلمة أخرى."
                : "No products found. Try another word."}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
