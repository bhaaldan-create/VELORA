"use client";

import {
  CATEGORY_LABELS,
  CONCERN_LABELS,
  SKIN_TYPE_LABELS,
  SORT_LABELS,
} from "@/data/popular-searches";
import type { CatalogSearchParams } from "@/lib/catalog-search-params";
import type { CatalogFacets } from "@/lib/catalog-search-params";
import { formatPrice } from "@/lib/utils";

type Chip = { key: string; label: string; onRemove: () => void };

type Props = {
  ar?: boolean;
  params: CatalogSearchParams;
  facets?: CatalogFacets | null;
  onClearAll: () => void;
  onRemove: (patch: Partial<CatalogSearchParams>) => void;
};

export function ActiveFilterChips({
  ar = false,
  params,
  onClearAll,
  onRemove,
}: Props) {
  const chips: Chip[] = [];

  if (params.q) {
    chips.push({
      key: "q",
      label: `“${params.q}”`,
      onRemove: () => onRemove({ q: "" }),
    });
  }
  if (params.category) {
    const lab = CATEGORY_LABELS[params.category];
    chips.push({
      key: "category",
      label: ar ? lab.ar : lab.en,
      onRemove: () => onRemove({ category: undefined }),
    });
  }
  if (params.brand) {
    chips.push({
      key: "brand",
      label: params.brand,
      onRemove: () => onRemove({ brand: undefined }),
    });
  }
  if (params.productType) {
    chips.push({
      key: "productType",
      label: params.productType,
      onRemove: () => onRemove({ productType: undefined }),
    });
  }
  if (params.minPrice != null || params.maxPrice != null) {
    const min = params.minPrice != null ? formatPrice(params.minPrice) : "…";
    const max = params.maxPrice != null ? formatPrice(params.maxPrice) : "…";
    chips.push({
      key: "price",
      label: `${min} — ${max}`,
      onRemove: () => onRemove({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  for (const c of params.concerns) {
    chips.push({
      key: `concern-${c}`,
      label: ar ? CONCERN_LABELS[c].ar : CONCERN_LABELS[c].en,
      onRemove: () =>
        onRemove({ concerns: params.concerns.filter((x) => x !== c) }),
    });
  }
  for (const s of params.skinTypes) {
    chips.push({
      key: `skin-${s}`,
      label: ar ? SKIN_TYPE_LABELS[s].ar : SKIN_TYPE_LABELS[s].en,
      onRemove: () =>
        onRemove({ skinTypes: params.skinTypes.filter((x) => x !== s) }),
    });
  }
  for (const i of params.ingredients) {
    chips.push({
      key: `ing-${i}`,
      label: i,
      onRemove: () =>
        onRemove({
          ingredients: params.ingredients.filter((x) => x !== i),
        }),
    });
  }
  for (const f of params.features) {
    chips.push({
      key: `feat-${f}`,
      label: f,
      onRemove: () =>
        onRemove({ features: params.features.filter((x) => x !== f) }),
    });
  }
  if (params.ratingMin != null) {
    chips.push({
      key: "rating",
      label: `${params.ratingMin}+ ★`,
      onRemove: () => onRemove({ ratingMin: undefined }),
    });
  }
  if (params.inStock) {
    chips.push({
      key: "stock",
      label: ar ? "متوفر" : "In Stock",
      onRemove: () => onRemove({ inStock: false }),
    });
  }
  if (params.onSale) {
    chips.push({
      key: "sale",
      label: ar ? "عروض" : "On Sale",
      onRemove: () => onRemove({ onSale: false }),
    });
  }
  if (params.isNew) {
    chips.push({
      key: "new",
      label: ar ? "جديد" : "New",
      onRemove: () => onRemove({ isNew: false }),
    });
  }
  if (params.isBestseller) {
    chips.push({
      key: "best",
      label: ar ? "الأكثر طلبًا" : "Best Selling",
      onRemove: () => onRemove({ isBestseller: false }),
    });
  }
  if (params.origin) {
    chips.push({
      key: "origin",
      label: params.origin,
      onRemove: () => onRemove({ origin: undefined }),
    });
  }
  if (params.sort && params.sort !== "best-match" && params.sort !== "best-selling") {
    const lab = SORT_LABELS[params.sort];
    if (lab) {
      chips.push({
        key: "sort",
        label: ar ? lab.ar : lab.en,
        onRemove: () =>
          onRemove({ sort: params.q ? "best-match" : "best-selling" }),
      });
    }
  }

  if (!chips.length) return null;

  return (
    <div className="vs-chips" aria-label={ar ? "فلاتر نشطة" : "Active filters"}>
      {chips.map((c) => (
        <span key={c.key} className="vs-chip">
          {c.label}
          <button type="button" aria-label={ar ? "إزالة" : "Remove"} onClick={c.onRemove}>
            ×
          </button>
        </span>
      ))}
      <button type="button" className="vs-btn vs-btn--ghost" onClick={onClearAll}>
        {ar ? "مسح الكل" : "Clear all"}
      </button>
    </div>
  );
}
