"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  CONCERN_LABELS,
  SKIN_TYPE_LABELS,
} from "@/data/popular-searches";
import type { CatalogFacets, CatalogSearchParams } from "@/lib/catalog-search-params";
import type { CategorySlug, SkinConcern, SkinType } from "@/types";
import { formatPrice } from "@/lib/utils";

type Props = {
  ar?: boolean;
  params: CatalogSearchParams;
  facets: CatalogFacets | null;
  onChange: (patch: Partial<CatalogSearchParams>) => void;
  toggleConcern: (c: SkinConcern) => void;
  toggleSkinType: (s: SkinType) => void;
  toggleList: (key: "ingredients" | "features", value: string) => void;
};

export function FilterPanel({
  ar = false,
  params,
  facets,
  onChange,
  toggleConcern,
  toggleSkinType,
  toggleList,
}: Props) {
  const [brandQ, setBrandQ] = useState("");
  const brands = useMemo(() => {
    const list = facets?.brands ?? [];
    const q = brandQ.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.toLowerCase().includes(q));
  }, [facets?.brands, brandQ]);

  const priceMinBound = facets?.priceMin ?? 0;
  const priceMaxBound = facets?.priceMax || 200000;

  return (
    <div>
      <section className="vs-section">
        <h3 className="vs-section__title">{ar ? "التصنيف" : "Category"}</h3>
        {(Object.keys(CATEGORY_LABELS) as CategorySlug[]).map((slug) => (
          <label key={slug} className="vs-check">
            <input
              type="radio"
              name="vs-category"
              checked={params.category === slug}
              onChange={() => onChange({ category: slug })}
            />
            {ar ? CATEGORY_LABELS[slug].ar : CATEGORY_LABELS[slug].en}
          </label>
        ))}
        <button
          type="button"
          className="vs-btn vs-btn--ghost mt-1"
          onClick={() => onChange({ category: undefined })}
        >
          {ar ? "الكل" : "All"}
        </button>
      </section>

      {facets?.productTypes?.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">
            {ar ? "نوع المنتج" : "Product Type"}
          </h3>
          {facets.productTypes.map((t) => (
            <label key={t} className="vs-check">
              <input
                type="radio"
                name="vs-ptype"
                checked={params.productType === t}
                onChange={() => onChange({ productType: t })}
              />
              {t}
            </label>
          ))}
          {params.productType ? (
            <button
              type="button"
              className="vs-btn vs-btn--ghost"
              onClick={() => onChange({ productType: undefined })}
            >
              {ar ? "مسح" : "Clear"}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="vs-section">
        <h3 className="vs-section__title">{ar ? "السعر" : "Price"}</h3>
        <div className="vs-price">
          <div className="vs-price__row">
            <input
              type="number"
              inputMode="numeric"
              placeholder={ar ? "من" : "Min"}
              value={params.minPrice ?? ""}
              min={0}
              onChange={(e) =>
                onChange({
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder={ar ? "إلى" : "Max"}
              value={params.maxPrice ?? ""}
              min={0}
              onChange={(e) =>
                onChange({
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <input
            className="vs-price__range"
            type="range"
            min={priceMinBound}
            max={priceMaxBound}
            step={1000}
            value={params.maxPrice ?? priceMaxBound}
            onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
          />
          <p className="vs-suggest__meta">
            {formatPrice(params.minPrice ?? priceMinBound)} —{" "}
            {formatPrice(params.maxPrice ?? priceMaxBound)}
          </p>
        </div>
      </section>

      <section className="vs-section">
        <h3 className="vs-section__title">{ar ? "التوفر" : "Availability"}</h3>
        <label className="vs-check">
          <input
            type="checkbox"
            checked={!!params.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
          />
          {ar ? "متوفر الآن" : "In Stock"}
        </label>
        <label className="vs-check">
          <input
            type="checkbox"
            checked={!!params.onSale}
            onChange={(e) => onChange({ onSale: e.target.checked })}
          />
          {ar ? "عروض" : "On Sale"}
        </label>
      </section>

      {brands.length || facets?.brands?.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">{ar ? "الماركة" : "Brand"}</h3>
          <input
            className="vs-brand-search"
            value={brandQ}
            onChange={(e) => setBrandQ(e.target.value)}
            placeholder={ar ? "ابحثي عن ماركة…" : "Search brand…"}
          />
          <div style={{ maxHeight: 160, overflow: "auto" }}>
            {brands.slice(0, 40).map((b) => (
              <label key={b} className="vs-check">
                <input
                  type="radio"
                  name="vs-brand"
                  checked={params.brand?.toLowerCase() === b.toLowerCase()}
                  onChange={() => onChange({ brand: b })}
                />
                {b}
              </label>
            ))}
          </div>
          {params.brand ? (
            <button
              type="button"
              className="vs-btn vs-btn--ghost"
              onClick={() => onChange({ brand: undefined })}
            >
              {ar ? "مسح الماركة" : "Clear brand"}
            </button>
          ) : null}
        </section>
      ) : null}

      {facets?.skinTypes?.length || params.skinTypes.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">{ar ? "نوع البشرة" : "Skin Type"}</h3>
          {(
            (facets?.skinTypes?.length
              ? facets.skinTypes
              : Object.keys(SKIN_TYPE_LABELS)) as SkinType[]
          ).map((s) => (
            <label key={s} className="vs-check">
              <input
                type="checkbox"
                checked={params.skinTypes.includes(s)}
                onChange={() => toggleSkinType(s)}
              />
              {ar ? SKIN_TYPE_LABELS[s]?.ar || s : SKIN_TYPE_LABELS[s]?.en || s}
            </label>
          ))}
        </section>
      ) : null}

      {facets?.concerns?.length || params.concerns.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">
            {ar ? "اهتمامات البشرة" : "Skin Concerns"}
          </h3>
          {(
            (facets?.concerns?.length
              ? facets.concerns
              : Object.keys(CONCERN_LABELS)) as SkinConcern[]
          ).map((c) => (
            <label key={c} className="vs-check">
              <input
                type="checkbox"
                checked={params.concerns.includes(c)}
                onChange={() => toggleConcern(c)}
              />
              {ar ? CONCERN_LABELS[c]?.ar || c : CONCERN_LABELS[c]?.en || c}
            </label>
          ))}
        </section>
      ) : null}

      {facets?.ingredients?.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">
            {ar ? "المكونات" : "Ingredients"}
          </h3>
          <div style={{ maxHeight: 140, overflow: "auto" }}>
            {facets.ingredients.slice(0, 30).map((i) => (
              <label key={i} className="vs-check">
                <input
                  type="checkbox"
                  checked={params.ingredients.includes(i)}
                  onChange={() => toggleList("ingredients", i)}
                />
                {i}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {facets?.featureTags?.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">{ar ? "الميزات" : "Features"}</h3>
          {facets.featureTags.map((f) => (
            <label key={f} className="vs-check">
              <input
                type="checkbox"
                checked={params.features.includes(f)}
                onChange={() => toggleList("features", f)}
              />
              {f}
            </label>
          ))}
        </section>
      ) : null}

      {facets?.origins?.length ? (
        <section className="vs-section">
          <h3 className="vs-section__title">{ar ? "المنشأ" : "Origin"}</h3>
          {facets.origins.map((o) => (
            <label key={o.code} className="vs-check">
              <input
                type="radio"
                name="vs-origin"
                checked={params.origin === o.code}
                onChange={() => onChange({ origin: o.code })}
              />
              {ar ? o.labelAr : o.labelEn}
            </label>
          ))}
          {params.origin ? (
            <button
              type="button"
              className="vs-btn vs-btn--ghost"
              onClick={() => onChange({ origin: undefined })}
            >
              {ar ? "مسح" : "Clear"}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="vs-section">
        <h3 className="vs-section__title">{ar ? "التقييم" : "Rating"}</h3>
        {[4.5, 4, 3.5].map((r) => (
          <label key={r} className="vs-check">
            <input
              type="radio"
              name="vs-rating"
              checked={params.ratingMin === r}
              onChange={() => onChange({ ratingMin: r })}
            />
            {r}+ ★
          </label>
        ))}
        {params.ratingMin != null ? (
          <button
            type="button"
            className="vs-btn vs-btn--ghost"
            onClick={() => onChange({ ratingMin: undefined })}
          >
            {ar ? "مسح" : "Clear"}
          </button>
        ) : null}
      </section>
    </div>
  );
}
