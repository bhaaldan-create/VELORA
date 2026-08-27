"use client";

import type { PopularSearch } from "@/data/popular-searches";
import type { CategorySlug, Product } from "@/types";

export type SuggestPayload = {
  products: Product[];
  brands: { name: string; nameAr: string; slug: string; href: string }[];
  categories: { slug: CategorySlug; name: string; nameAr: string }[];
  popular: PopularSearch[];
};

type Props = {
  open: boolean;
  ar?: boolean;
  loading?: boolean;
  /** True when the input has a non-empty query */
  hasQuery?: boolean;
  data: SuggestPayload | null;
  recent: string[];
  onPickQuery: (q: string) => void;
  onPickHref: (href: string) => void;
  onClearRecent: () => void;
  /** Embedded inside SearchFocusLayer — flow layout, not absolute dropdown */
  embedded?: boolean;
};

export function SearchSuggestions({
  open,
  ar = false,
  loading,
  hasQuery = false,
  data,
  recent,
  onPickQuery,
  onPickHref,
  onClearRecent,
  embedded = false,
}: Props) {
  if (!open) return null;

  const products = data?.products ?? [];
  const brands = data?.brands ?? [];
  const categories = data?.categories ?? [];
  const popular = data?.popular ?? [];
  const hasQueryResults =
    products.length > 0 || brands.length > 0 || categories.length > 0;

  return (
    <div
      className={embedded ? "vs-suggest vs-suggest--embedded" : "vs-suggest"}
      role="listbox"
      aria-label={ar ? "اقتراحات" : "Suggestions"}
    >
      {loading ? (
        <p className="vs-suggest__meta" style={{ padding: "0.5rem 0.65rem" }}>
          {ar ? "جارٍ البحث…" : "Searching…"}
        </p>
      ) : null}

      {hasQueryResults ? (
        <>
          {products.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">{ar ? "منتجات" : "Products"}</p>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="vs-suggest__item"
                  onClick={() => onPickHref(`/shop/${p.slug}`)}
                >
                  <span>{ar ? p.nameAr : p.name}</span>
                  {p.brandName ? (
                    <span className="vs-suggest__meta">{p.brandName}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {brands.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">{ar ? "ماركات" : "Brands"}</p>
              {brands.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  className="vs-suggest__item"
                  onClick={() => onPickHref(b.href)}
                >
                  {ar ? b.nameAr : b.name}
                </button>
              ))}
            </div>
          ) : null}

          {categories.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">{ar ? "تصنيفات" : "Categories"}</p>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  className="vs-suggest__item"
                  onClick={() => onPickHref(`/shop?category=${c.slug}`)}
                >
                  {ar ? c.nameAr : c.name}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : !loading && !hasQuery ? (
        <>
          {recent.length ? (
            <div className="vs-suggest__group">
              <div className="flex items-center justify-between px-1">
                <p className="vs-suggest__title" style={{ margin: 0 }}>
                  {ar ? "عمليات بحث أخيرة" : "Recent searches"}
                </p>
                <button
                  type="button"
                  className="vs-btn vs-btn--ghost"
                  style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem" }}
                  onClick={onClearRecent}
                >
                  {ar ? "مسح" : "Clear"}
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="vs-suggest__item"
                  onClick={() => onPickQuery(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          ) : null}

          {popular.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">
                {ar ? "الأكثر بحثًا" : "Popular searches"}
              </p>
              {popular.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="vs-suggest__item"
                  onClick={() => {
                    try {
                      const url = new URL(p.href, "https://velora.local");
                      const q = url.searchParams.get("q");
                      if (url.pathname.includes("/search") && q) {
                        onPickQuery(q);
                        return;
                      }
                    } catch {
                      /* fall through */
                    }
                    onPickHref(p.href);
                  }}
                >
                  {ar ? p.labelAr : p.labelEn}
                </button>
              ))}
            </div>
          ) : null}

          {!recent.length && !popular.length ? (
            <p className="vs-suggest__meta" style={{ padding: "0.75rem 0.65rem" }}>
              {ar
                ? "ابدئي بالكتابة للبحث عن منتج أو ماركة."
                : "Start typing to search products or brands."}
            </p>
          ) : null}
        </>
      ) : !loading && hasQuery ? (
        <p className="vs-suggest__meta" style={{ padding: "0.75rem 0.65rem" }}>
          {ar ? "لا توجد اقتراحات مطابقة." : "No matching suggestions."}
        </p>
      ) : null}
    </div>
  );
}
