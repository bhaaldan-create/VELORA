"use client";

import type { CatalogFacets, CatalogSearchParams } from "@/lib/catalog-search-params";
import type { SkinConcern, SkinType } from "@/types";
import { FilterPanel } from "./FilterPanel";

type Props = {
  open: boolean;
  ar?: boolean;
  params: CatalogSearchParams;
  facets: CatalogFacets | null;
  onClose: () => void;
  onChange: (patch: Partial<CatalogSearchParams>) => void;
  onReset: () => void;
  toggleConcern: (c: SkinConcern) => void;
  toggleSkinType: (s: SkinType) => void;
  toggleList: (key: "ingredients" | "features", value: string) => void;
};

export function FilterDrawer({
  open,
  ar = false,
  params,
  facets,
  onClose,
  onChange,
  onReset,
  toggleConcern,
  toggleSkinType,
  toggleList,
}: Props) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="vs-drawer-backdrop"
        aria-label={ar ? "إغلاق" : "Close"}
        onClick={onClose}
      />
      <div className="vs-drawer" role="dialog" aria-modal="true">
        <div className="vs-drawer__head">
          <h2 className="vs-drawer__title">{ar ? "الفلاتر" : "Filters"}</h2>
          <button type="button" className="vs-btn" onClick={onClose}>
            {ar ? "إغلاق" : "Close"}
          </button>
        </div>
        <FilterPanel
          ar={ar}
          params={params}
          facets={facets}
          onChange={onChange}
          toggleConcern={toggleConcern}
          toggleSkinType={toggleSkinType}
          toggleList={toggleList}
        />
        <div className="vs-drawer__actions">
          <button type="button" className="vs-btn" onClick={onReset}>
            {ar ? "إعادة ضبط" : "Reset"}
          </button>
          <button
            type="button"
            className="vs-btn vs-btn--primary flex-1 justify-center"
            onClick={onClose}
          >
            {ar ? "تطبيق الفلاتر" : "Apply filters"}
          </button>
        </div>
      </div>
    </>
  );
}
