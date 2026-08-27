"use client";

import type { CatalogSearchParams, CatalogSort } from "@/lib/catalog-search-params";

type Props = {
  ar?: boolean;
  params: CatalogSearchParams;
  onApply: (patch: Partial<CatalogSearchParams>) => void;
};

const QUICK: {
  id: string;
  en: string;
  ar: string;
  patch: Partial<CatalogSearchParams>;
  active: (p: CatalogSearchParams) => boolean;
}[] = [
  {
    id: "best",
    en: "Best Selling",
    ar: "الأكثر طلبًا",
    patch: { sort: "best-selling" as CatalogSort, isBestseller: true },
    active: (p) => !!p.isBestseller || p.sort === "best-selling",
  },
  {
    id: "rated",
    en: "Top Rated",
    ar: "الأعلى تقييمًا",
    patch: { sort: "top-rated", ratingMin: 4 },
    active: (p) => p.sort === "top-rated" || (p.ratingMin ?? 0) >= 4,
  },
  {
    id: "new",
    en: "New",
    ar: "جديد",
    patch: { isNew: true, sort: "newest" },
    active: (p) => !!p.isNew,
  },
  {
    id: "sale",
    en: "Sale",
    ar: "عروض",
    patch: { onSale: true, sort: "on-sale" },
    active: (p) => !!p.onSale,
  },
  {
    id: "under25",
    en: "Under 25K",
    ar: "أقل من 25 ألف",
    patch: { maxPrice: 25000 },
    active: (p) => p.maxPrice === 25000,
  },
];

export function QuickFilters({ ar = false, params, onApply }: Props) {
  return (
    <div className="vs-quick" aria-label={ar ? "فلاتر سريعة" : "Quick filters"}>
      {QUICK.map((q) => {
        const active = q.active(params);
        return (
          <button
            key={q.id}
            type="button"
            className="vs-quick__pill"
            data-active={active}
            onClick={() => {
              if (active) {
                onApply({
                  isBestseller: q.id === "best" ? false : params.isBestseller,
                  isNew: q.id === "new" ? false : params.isNew,
                  onSale: q.id === "sale" ? false : params.onSale,
                  ratingMin: q.id === "rated" ? undefined : params.ratingMin,
                  maxPrice: q.id === "under25" ? undefined : params.maxPrice,
                  sort: params.q ? "best-match" : "best-selling",
                });
              } else {
                onApply(q.patch);
              }
            }}
          >
            {ar ? q.ar : q.en}
          </button>
        );
      })}
    </div>
  );
}
