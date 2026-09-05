"use client";

import type { CatalogSearchParams, CatalogSort } from "@/lib/catalog-search-params";

type Props = {
  ar?: boolean;
  params: CatalogSearchParams;
  onApply: (patch: Partial<CatalogSearchParams>) => void;
};

const QUICK: {
  id: "best" | "rated" | "new" | "sale" | "under25";
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
    active: (p) => !!p.isBestseller,
  },
  {
    id: "rated",
    en: "Top Rated",
    ar: "الأعلى تقييمًا",
    patch: { sort: "top-rated", ratingMin: 4 },
    active: (p) => (p.ratingMin ?? 0) >= 4,
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

function clearPatchFor(
  id: (typeof QUICK)[number]["id"],
  params: CatalogSearchParams,
): Partial<CatalogSearchParams> {
  const defaultSort: CatalogSort = params.q ? "best-match" : "best-selling";
  switch (id) {
    case "best":
      return { isBestseller: false, sort: defaultSort };
    case "rated":
      return { ratingMin: undefined, sort: defaultSort };
    case "new":
      return { isNew: false, sort: defaultSort };
    case "sale":
      return { onSale: false, sort: defaultSort };
    case "under25":
      return { maxPrice: undefined };
  }
}

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
              onApply(active ? clearPatchFor(q.id, params) : q.patch);
            }}
          >
            {ar ? q.ar : q.en}
          </button>
        );
      })}
    </div>
  );
}
