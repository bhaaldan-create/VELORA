"use client";

import Link from "next/link";
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
  data: SuggestPayload | null;
  recent: string[];
  onPickQuery: (q: string) => void;
  onClearRecent: () => void;
  onClose: () => void;
};

export function SearchSuggestions({
  open,
  ar = false,
  loading,
  data,
  recent,
  onPickQuery,
  onClearRecent,
  onClose,
}: Props) {
  if (!open) return null;

  const hasQueryResults =
    !!data &&
    (data.products.length > 0 ||
      data.brands.length > 0 ||
      data.categories.length > 0);

  return (
    <div className="vs-suggest" role="listbox" aria-label={ar ? "اقتراحات" : "Suggestions"}>
      {loading ? (
        <p className="vs-suggest__meta" style={{ padding: "0.5rem 0.65rem" }}>
          {ar ? "جارٍ البحث…" : "Searching…"}
        </p>
      ) : null}

      {hasQueryResults ? (
        <>
          {data!.products.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">{ar ? "منتجات" : "Products"}</p>
              {data!.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className="vs-suggest__item"
                  onClick={onClose}
                >
                  <span>{ar ? p.nameAr : p.name}</span>
                  {p.brandName ? (
                    <span className="vs-suggest__meta">{p.brandName}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}

          {data!.brands.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">{ar ? "ماركات" : "Brands"}</p>
              {data!.brands.map((b) => (
                <Link
                  key={b.slug}
                  href={b.href}
                  className="vs-suggest__item"
                  onClick={onClose}
                >
                  {ar ? b.nameAr : b.name}
                </Link>
              ))}
            </div>
          ) : null}

          {data!.categories.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">{ar ? "تصنيفات" : "Categories"}</p>
              {data!.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  className="vs-suggest__item"
                  onClick={onClose}
                >
                  {ar ? c.nameAr : c.name}
                </Link>
              ))}
            </div>
          ) : null}
        </>
      ) : (
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

          {data?.popular?.length ? (
            <div className="vs-suggest__group">
              <p className="vs-suggest__title">
                {ar ? "الأكثر بحثًا" : "Popular searches"}
              </p>
              {data.popular.map((p) => (
                <Link
                  key={p.id}
                  href={p.href}
                  className="vs-suggest__item"
                  onClick={onClose}
                >
                  {ar ? p.labelAr : p.labelEn}
                </Link>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
