"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getShopBrand } from "@/data/shop-brands";
import { ProductScrollRail } from "@/components/shop/ProductScrollRail";
import { CompactProductCard } from "@/components/shop/CompactProductCard";
import {
  ActiveFilterChips,
  FilterDrawer,
  FilterPanel,
  QuickFilters,
  ResultCount,
  SearchEmptyState,
  SortMenu,
  useCatalogSearchParams,
} from "@/components/search";
import "@/components/search/search-ui.css";
import { useLocale } from "@/context/LocaleContext";
import type { CatalogFacets } from "@/lib/catalog-search-params";
import { serializeCatalogSearchParams } from "@/lib/catalog-search-params";
import type { Category, CategorySlug, Product } from "@/types";
import { cn } from "@/lib/utils";

interface ShopCatalogProps {
  categories: Category[];
  products: Product[];
}

export function ShopCatalog({ categories, products }: ShopCatalogProps) {
  const { locale, t } = useLocale();
  const ar = locale !== "en";
  const {
    params,
    replace,
    clearAll,
    toggleConcern,
    toggleSkinType,
    toggleList,
    setCategory,
    setSort,
    hasActiveFilters,
  } = useCatalogSearchParams();

  const brandMeta = getShopBrand(params.brand);
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [remote, setRemote] = useState<Product[] | null>(null);
  const [remoteTotal, setRemoteTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const advanced =
    hasActiveFilters &&
    (!!params.q ||
      !!params.productType ||
      params.minPrice != null ||
      params.maxPrice != null ||
      params.inStock ||
      params.concerns.length > 0 ||
      params.skinTypes.length > 0 ||
      params.ingredients.length > 0 ||
      params.features.length > 0 ||
      params.ratingMin != null ||
      params.onSale ||
      params.isNew ||
      params.isBestseller ||
      !!params.origin ||
      (params.sort &&
        params.sort !== "best-selling" &&
        params.sort !== "best-match") ||
      // brand as free-text brandName (not only shop-brands slug)
      (!!params.brand && !brandMeta));

  useEffect(() => {
    void fetch("/api/catalog/facets")
      .then((r) => r.json())
      .then((d: { ok?: boolean; facets?: CatalogFacets }) => {
        if (d.ok && d.facets) setFacets(d.facets);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!advanced) {
      setRemote(null);
      setRemoteTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const qs = serializeCatalogSearchParams(params).toString();
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/catalog/search?${qs}`);
          const data = (await res.json()) as {
            ok?: boolean;
            products?: Product[];
            total?: number;
          };
          setRemote(
            data.ok && Array.isArray(data.products) ? data.products : [],
          );
          setRemoteTotal(typeof data.total === "number" ? data.total : 0);
        } catch {
          setRemote([]);
          setRemoteTotal(0);
        } finally {
          setLoading(false);
        }
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [advanced, params]);

  const list = useMemo(() => {
    if (advanced && remote) return remote;
    let result = products;
    if (brandMeta) {
      result = result.filter((p) => {
        const hay = `${p.name} ${p.nameAr} ${p.brandName || ""}`.toLowerCase();
        return (
          brandMeta.match.some((m) => hay.includes(m)) ||
          hay.includes(brandMeta.name.toLowerCase())
        );
      });
    } else if (params.brand) {
      const b = params.brand.toLowerCase();
      result = result.filter(
        (p) =>
          p.brandName?.toLowerCase().includes(b) ||
          p.name.toLowerCase().includes(b) ||
          p.nameAr.includes(params.brand!),
      );
    }
    if (params.category) {
      result = result.filter((p) => p.category === params.category);
    }
    return result;
  }, [advanced, remote, products, brandMeta, params.brand, params.category]);

  const rails = useMemo(() => {
    if (hasActiveFilters) return null;
    return categories
      .map((cat) => ({
        cat,
        items: products.filter((p) => p.category === cat.slug).slice(0, 12),
      }))
      .filter((r) => r.items.length > 0);
  }, [hasActiveFilters, categories, products]);

  const heading = brandMeta
    ? locale === "en"
      ? brandMeta.name
      : brandMeta.nameAr
    : params.category
      ? locale === "en"
        ? (categories.find((c) => c.slug === params.category)?.name ?? t.shop)
        : (categories.find((c) => c.slug === params.category)?.nameAr ?? t.shop)
      : locale === "en"
        ? "Shop"
        : "التسوق";

  const total = advanced ? remoteTotal : list.length;

  return (
    <div className="vs-root">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {brandMeta ? (
            <Link
              href="/search"
              className="font-latin text-[11px] font-medium tracking-[0.16em] text-[var(--muted)] uppercase transition-colors hover:text-[var(--plum)]"
            >
              ← Brands
            </Link>
          ) : null}
          <h1
            className={cn(
              "mt-2 text-[clamp(1.5rem,3.5vw,2.2rem)] font-black text-[var(--plum)]",
              brandMeta ? "font-latin tracking-tight" : "font-display",
            )}
            dir={brandMeta ? "ltr" : undefined}
          >
            {heading}
          </h1>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterPill
          active={!params.category}
          onClick={() => setCategory(undefined)}
          label={locale === "en" ? "All" : "الكل"}
        />
        {categories.map((cat) => (
          <FilterPill
            key={cat.slug}
            active={params.category === cat.slug}
            onClick={() => setCategory(cat.slug as CategorySlug)}
            label={locale === "en" ? cat.name : cat.nameAr}
          />
        ))}
      </div>

      <div className="vs-toolbar">
        <div className="vs-mobile-filters">
          <button
            type="button"
            className="vs-btn"
            onClick={() => setDrawerOpen(true)}
          >
            {ar ? "فلاتر" : "Filters"}
          </button>
        </div>
        <SortMenu
          ar={ar}
          value={params.sort}
          hasQuery={!!params.q}
          onChange={setSort}
        />
      </div>

      <QuickFilters ar={ar} params={params} onApply={replace} />
      <ActiveFilterChips
        ar={ar}
        params={params}
        onClearAll={clearAll}
        onRemove={replace}
      />

      {rails ? (
        <div className="mt-10 space-y-12">
          {rails.map(({ cat, items }) => (
            <section key={cat.slug}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[1.15rem] font-semibold text-[var(--plum)]">
                  {locale === "en" ? cat.name : cat.nameAr}
                </h2>
                <button
                  type="button"
                  onClick={() => setCategory(cat.slug as CategorySlug)}
                  className="font-latin text-[11px] font-medium tracking-[0.12em] text-[var(--muted)] uppercase hover:text-[var(--plum)]"
                >
                  {locale === "en" ? "See all" : "الكل"}
                </button>
              </div>
              <ProductScrollRail products={items} variant="compact" />
            </section>
          ))}
        </div>
      ) : (
        <div className="vs-layout mt-6">
          <aside className="vs-sidebar">
            <FilterPanel
              ar={ar}
              params={params}
              facets={facets}
              onChange={replace}
              toggleConcern={toggleConcern}
              toggleSkinType={toggleSkinType}
              toggleList={toggleList}
            />
          </aside>
          <div>
            <ResultCount ar={ar} total={total} />
            {loading ? (
              <div className="h-40 animate-pulse rounded-3xl bg-[var(--mist)]" />
            ) : list.length ? (
              advanced ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {list.map((product) => (
                    <CompactProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <ProductScrollRail products={list} variant="compact" />
              )
            ) : (
              <SearchEmptyState ar={ar} onClear={clearAll} />
            )}
          </div>
        </div>
      )}

      <FilterDrawer
        open={drawerOpen}
        ar={ar}
        params={params}
        facets={facets}
        onClose={() => setDrawerOpen(false)}
        onChange={replace}
        onReset={clearAll}
        toggleConcern={toggleConcern}
        toggleSkinType={toggleSkinType}
        toggleList={toggleList}
      />
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
