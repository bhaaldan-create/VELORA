"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  brandCountries,
  shopBrands,
  type ShopBrandCountryCode,
} from "@/data/shop-brands";
import { BrandCard } from "@/components/shop/BrandCard";
import { CompactProductCard } from "@/components/shop/CompactProductCard";
import {
  ActiveFilterChips,
  FilterDrawer,
  FilterPanel,
  QuickFilters,
  ResultCount,
  SearchBar,
  SearchEmptyState,
  SearchFocusLayer,
  SearchSuggestions,
  SortMenu,
  useCatalogSearchParams,
  type SuggestPayload,
} from "@/components/search";
import "@/components/search/search-ui.css";
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
} from "@/components/search/recent-searches";
import { popularSearches } from "@/data/popular-searches";
import { useLocale } from "@/context/LocaleContext";
import type { CatalogFacets } from "@/lib/catalog-search-params";
import { serializeCatalogSearchParams } from "@/lib/catalog-search-params";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export function SearchScreen() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const {
    params,
    replace,
    clearAll,
    toggleConcern,
    toggleSkinType,
    toggleList,
    setSort,
    hasActiveFilters,
  } = useCatalogSearchParams();

  const [draftQ, setDraftQ] = useState(params.q);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggest, setSuggest] = useState<SuggestPayload | null>({
    products: [],
    brands: [],
    categories: [],
    popular: popularSearches,
  });
  const [recent, setRecent] = useState<string[]>([]);
  const [country, setCountry] = useState<ShopBrandCountryCode | "all">("all");
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeSearchFocus = useCallback(() => {
    setSuggestOpen(false);
  }, []);

  const openSearchFocus = useCallback(() => {
    setSuggestOpen(true);
  }, []);

  useEffect(() => {
    setDraftQ(params.q);
  }, [params.q]);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  useEffect(() => {
    void fetch("/api/catalog/facets")
      .then((r) => r.json())
      .then((d: { ok?: boolean; facets?: CatalogFacets }) => {
        if (d.ok && d.facets) setFacets(d.facets);
      })
      .catch(() => undefined);
  }, []);

  // Suggestions while typing (only when focus layer is open)
  useEffect(() => {
    const q = draftQ.trim();
    if (!suggestOpen) return;
    if (!q) {
      setSuggest({
        products: [],
        brands: [],
        categories: [],
        popular: popularSearches,
      });
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/catalog/suggest?q=${encodeURIComponent(q)}`,
          );
          const data = (await res.json()) as SuggestPayload & { ok?: boolean };
          setSuggest({
            products: data.products || [],
            brands: data.brands || [],
            categories: data.categories || [],
            popular: data.popular || popularSearches,
          });
        } catch {
          setSuggest({
            products: [],
            brands: [],
            categories: [],
            popular: popularSearches,
          });
        } finally {
          setSuggestLoading(false);
        }
      })();
    }, 200);
    return () => window.clearTimeout(t);
  }, [draftQ, suggestOpen]);

  // Results from URL state
  useEffect(() => {
    if (!hasActiveFilters) {
      setResults([]);
      setTotal(0);
      setSearching(false);
      return;
    }
    setSearching(true);
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
          setResults(
            data.ok && Array.isArray(data.products) ? data.products : [],
          );
          setTotal(typeof data.total === "number" ? data.total : 0);
        } catch {
          setResults([]);
          setTotal(0);
        } finally {
          setSearching(false);
        }
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [params, hasActiveFilters]);

  const commitSearch = useCallback(
    (q: string) => {
      const value = q.trim();
      if (value) {
        pushRecentSearch(value);
        setRecent(readRecentSearches());
      }
      setSuggestOpen(false);
      replace({ q: value, sort: value ? "best-match" : params.sort });
    },
    [params.sort, replace],
  );

  const brandsVisible = useMemo(() => {
    // Keep discover grid stable while the focus layer is open (draft typing
    // should not reshuffle brands under the overlay).
    const q = suggestOpen ? "" : draftQ.trim().toLowerCase();
    return shopBrands.filter((b) => {
      if (country !== "all" && b.countryCode !== country) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.nameAr.includes(draftQ.trim()) ||
        b.countryAr.includes(draftQ.trim()) ||
        b.country.toLowerCase().includes(q) ||
        b.match.some((m) => m.includes(q))
      );
    });
  }, [draftQ, country, suggestOpen]);

  const showDiscover = !hasActiveFilters;

  const placeholder = ar
    ? "ابحثي عن منتج، ماركة، أو نوع بشرة…"
    : "Search products, brands, or skin type…";

  return (
    <div className="vs-root relative mx-auto max-w-5xl">
      {/* Idle search chrome — opens dedicated focus layer */}
      <div
        className="relative flex items-start gap-3"
        inert={suggestOpen ? true : undefined}
      >
        <Link
          href="/"
          aria-label={ar ? "رجوع" : "Back"}
          tabIndex={suggestOpen ? -1 : undefined}
          className={cn(
            "mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "border border-[var(--border-glass)] bg-[var(--bg-glass)] text-[var(--plum)] shadow-[var(--shadow-md)]",
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

        <div className="relative min-w-0 flex-1">
          <SearchBar
            ar={ar}
            value={draftQ}
            onChange={(v) => {
              setDraftQ(v);
              if (!suggestOpen) openSearchFocus();
            }}
            onFocus={openSearchFocus}
            onPointerDown={openSearchFocus}
            onSubmit={() => commitSearch(draftQ)}
            onClear={() => {
              setDraftQ("");
              if (params.q) replace({ q: "" });
            }}
            placeholder={placeholder}
          />
        </div>
      </div>

      <SearchFocusLayer
        open={suggestOpen}
        ar={ar}
        onClose={closeSearchFocus}
      >
        <div className="vs-focus__chrome">
          <button
            type="button"
            className="vs-focus__back"
            aria-label={ar ? "إغلاق البحث" : "Close search"}
            onClick={closeSearchFocus}
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
          </button>
          <SearchBar
            ar={ar}
            elevated
            autoFocus
            value={draftQ}
            onChange={setDraftQ}
            onSubmit={() => commitSearch(draftQ)}
            onClear={() => {
              setDraftQ("");
              if (params.q) replace({ q: "" });
            }}
            placeholder={placeholder}
          />
        </div>
        <div className="vs-focus__body">
          <SearchSuggestions
            open
            embedded
            ar={ar}
            loading={suggestLoading}
            data={suggest}
            recent={recent}
            onPickQuery={(q) => {
              setDraftQ(q);
              commitSearch(q);
            }}
            onClearRecent={() => {
              clearRecentSearches();
              setRecent([]);
            }}
            onClose={closeSearchFocus}
          />
        </div>
      </SearchFocusLayer>

      {showDiscover ? (
        <>
          <header className="relative mt-10 text-center sm:mt-12">
            <h1 className="font-display text-[clamp(1.85rem,5vw,2.65rem)] font-bold tracking-[-0.02em] text-[var(--plum)]">
              {ar ? "البراندات" : "Brands"}
            </h1>
            <p className="mx-auto mt-2.5 max-w-md text-[0.92rem] leading-relaxed text-[var(--muted)]">
              {ar
                ? "تسوّقي من أفضل العلامات التجارية العالمية"
                : "Shop the world’s finest beauty houses"}
            </p>
          </header>

          <div className="relative mt-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCountry("all")}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[0.75rem] font-medium",
                country === "all"
                  ? "border-[var(--plum)]/20 bg-[var(--btn-bg)] text-[var(--btn-fg)]"
                  : "border-[var(--border-glass)] bg-[var(--bg-glass)] text-[var(--ink)]",
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
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.75rem] font-medium",
                  country === c.code
                    ? "border-[var(--plum)]/20 bg-[var(--btn-bg)] text-[var(--btn-fg)]"
                    : "border-[var(--border-glass)] bg-[var(--bg-glass)] text-[var(--ink)]",
                )}
              >
                <span aria-hidden>{c.flag}</span>
                <span>{ar ? c.nameAr : c.name}</span>
              </button>
            ))}
          </div>

          <section className="relative mt-8">
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
              {brandsVisible.map((b) => (
                <BrandCard key={b.id} brand={b} locale={ar ? "ar" : "en"} />
              ))}
            </div>
            {brandsVisible.length === 0 ? (
              <p className="mt-10 text-center text-[0.9rem] text-[var(--muted)]">
                {ar ? "لا يوجد براند مطابق." : "No matching brands."}
              </p>
            ) : (
              <p className="mt-6 text-center font-latin text-[0.7rem] tracking-[0.12em] text-[var(--muted)]/70 uppercase">
                {brandsVisible.length} {ar ? "براند" : "brands"}
              </p>
            )}
          </section>
        </>
      ) : (
        <section className="relative mt-8">
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

          <div className="vs-layout">
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
              {searching ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] animate-pulse rounded-[1.5rem] bg-[var(--bg-elevated)]"
                    />
                  ))}
                </div>
              ) : results.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {results.map((product) => (
                    <CompactProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <SearchEmptyState ar={ar} onClear={clearAll} />
              )}

              {total > params.pageSize ? (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    type="button"
                    className="vs-btn"
                    disabled={params.page <= 1}
                    onClick={() => replace({ page: params.page - 1 })}
                  >
                    {ar ? "السابق" : "Prev"}
                  </button>
                  <span className="vs-count self-center">{params.page}</span>
                  <button
                    type="button"
                    className="vs-btn"
                    disabled={params.page * params.pageSize >= total}
                    onClick={() => replace({ page: params.page + 1 })}
                  >
                    {ar ? "التالي" : "Next"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
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
