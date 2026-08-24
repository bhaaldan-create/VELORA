"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getShopBrand,
  productMatchesBrand,
} from "@/data/shop-brands";
import { ProductScrollRail } from "@/components/shop/ProductScrollRail";
import { useLocale } from "@/context/LocaleContext";
import type { Category, CategorySlug, Product } from "@/types";
import { cn } from "@/lib/utils";

interface ShopCatalogProps {
  categories: Category[];
}

export function ShopCatalog({ categories }: ShopCatalogProps) {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const brand = getShopBrand(searchParams.get("brand") ?? undefined);
  const categoryFromUrl = searchParams.get("category") ?? undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | undefined>(() =>
    categoryFromUrl && categories.some((c) => c.slug === categoryFromUrl)
      ? categoryFromUrl
      : undefined,
  );

  useEffect(() => {
    setCategory(
      categoryFromUrl && categories.some((c) => c.slug === categoryFromUrl)
        ? categoryFromUrl
        : undefined,
    );
  }, [categoryFromUrl, categories]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/catalog/products");
        const data = (await res.json()) as {
          ok?: boolean;
          products?: Product[];
        };
        if (!cancelled && data.ok && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      } catch {
        /* keep empty */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    let result = products;
    if (brand) {
      result = result.filter((p) =>
        productMatchesBrand(p.name, p.nameAr, brand),
      );
    }
    if (category) {
      result = result.filter((p) => p.category === (category as CategorySlug));
    }
    return result;
  }, [products, brand, category]);

  const rails = useMemo(() => {
    if (brand || category) return null;
    return categories
      .map((cat) => ({
        cat,
        items: products.filter((p) => p.category === cat.slug).slice(0, 12),
      }))
      .filter((r) => r.items.length > 0);
  }, [brand, category, categories, products]);

  const heading = brand
    ? locale === "en"
      ? brand.name
      : brand.nameAr
    : category
      ? locale === "en"
        ? (categories.find((c) => c.slug === category)?.name ?? t.shop)
        : (categories.find((c) => c.slug === category)?.nameAr ?? t.shop)
      : locale === "en"
        ? "Shop"
        : "التسوق";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {brand ? (
            <Link
              href="/search"
              className="font-latin text-[11px] font-medium tracking-[0.16em] text-[var(--muted)] uppercase transition-colors hover:text-[var(--plum)]"
            >
              ← Brands
            </Link>
          ) : null}
          <h1
            className={cn(
              "mt-2 text-[clamp(1.5rem,3.5vw,2.2rem)] font-semibold text-[var(--plum)]",
              brand ? "font-latin tracking-tight" : "font-display",
            )}
            dir={brand ? "ltr" : undefined}
          >
            {heading}
          </h1>
          <p className="mt-1 text-[0.85rem] text-[var(--muted)]">
            {loading
              ? locale === "en"
                ? "Loading…"
                : "جارٍ التحميل…"
              : locale === "en"
                ? `${list.length} products · swipe`
                : `${list.length} منتج · مرّري`}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterPill
          active={!category}
          onClick={() => setCategory(undefined)}
          label={locale === "en" ? "All" : "الكل"}
        />
        {categories.map((cat) => (
          <FilterPill
            key={cat.slug}
            active={category === cat.slug}
            onClick={() => setCategory(cat.slug)}
            label={locale === "en" ? cat.name : cat.nameAr}
          />
        ))}
      </div>

      {loading ? (
        <ShopCatalogSkeleton />
      ) : rails && !category ? (
        <div className="mt-10 space-y-12">
          {rails.map(({ cat, items }) => (
            <section key={cat.slug}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[1.15rem] font-semibold text-[var(--plum)]">
                  {locale === "en" ? cat.name : cat.nameAr}
                </h2>
                <button
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className="font-latin text-[11px] font-medium tracking-[0.12em] text-[var(--muted)] uppercase hover:text-[var(--plum)]"
                >
                  {locale === "en" ? "See all" : "الكل"}
                </button>
              </div>
              <ProductScrollRail products={items} variant="compact" />
            </section>
          ))}
        </div>
      ) : list.length ? (
        <div className="mt-8">
          <ProductScrollRail products={list} variant="compact" />
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-[var(--plum)]/12 px-6 py-16 text-center">
          <p className="text-[0.95rem] text-[var(--muted)]">
            {locale === "en"
              ? "No products here yet."
              : "لا توجد منتجات هنا حالياً."}
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block text-[0.875rem] text-[var(--plum)] underline underline-offset-4"
          >
            {locale === "en" ? "Browse brands" : "تصفّح البراندات"}
          </Link>
        </div>
      )}
    </div>
  );
}

function ShopCatalogSkeleton() {
  return (
    <div className="mt-8 flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] w-[42%] shrink-0 animate-pulse rounded-2xl bg-[var(--mist)] sm:w-[30%]"
        />
      ))}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition-colors duration-300",
        active
          ? "bg-[var(--plum)] text-[var(--ivory)]"
          : "bg-[var(--mist)] text-[var(--ink)]/70 hover:bg-[var(--champagne)]",
      )}
    >
      {label}
    </button>
  );
}
