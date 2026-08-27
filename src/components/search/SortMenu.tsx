"use client";

import { SORT_LABELS } from "@/data/popular-searches";
import type { CatalogSort } from "@/lib/catalog-search-params";

const OPTIONS: CatalogSort[] = [
  "best-match",
  "best-selling",
  "top-rated",
  "newest",
  "price-asc",
  "price-desc",
  "most-reviewed",
  "on-sale",
];

type Props = {
  ar?: boolean;
  value: CatalogSort;
  onChange: (sort: CatalogSort) => void;
  hasQuery?: boolean;
};

export function SortMenu({ ar = false, value, onChange, hasQuery }: Props) {
  const options = hasQuery
    ? OPTIONS
    : OPTIONS.filter((o) => o !== "best-match");

  return (
    <label className="vs-sort inline-flex items-center gap-2 text-[0.78rem] text-[var(--vs-muted)]">
      <span>{ar ? "ترتيب" : "Sort"}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CatalogSort)}
        aria-label={ar ? "ترتيب النتائج" : "Sort results"}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {ar ? SORT_LABELS[o].ar : SORT_LABELS[o].en}
          </option>
        ))}
      </select>
    </label>
  );
}
