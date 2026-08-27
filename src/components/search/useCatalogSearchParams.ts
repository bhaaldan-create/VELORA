"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  type CatalogSearchParams,
  type CatalogSort,
} from "@/lib/catalog-search-params";
import type { CategorySlug, SkinConcern, SkinType } from "@/types";

export function useCatalogSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );

  const replace = useCallback(
    (patch: Partial<CatalogSearchParams>, options?: { scroll?: boolean }) => {
      const merged: CatalogSearchParams = {
        ...params,
        ...patch,
        concerns: patch.concerns ?? params.concerns,
        skinTypes: patch.skinTypes ?? params.skinTypes,
        ingredients: patch.ingredients ?? params.ingredients,
        features: patch.features ?? params.features,
        page: patch.page ?? (patch.q !== undefined || patch.category !== undefined || patch.brand !== undefined || patch.sort !== undefined ? 1 : params.page),
      };
      // Reset page when filters change unless page explicitly set
      if (
        patch.page === undefined &&
        (patch.q !== undefined ||
          patch.category !== undefined ||
          patch.brand !== undefined ||
          patch.productType !== undefined ||
          patch.minPrice !== undefined ||
          patch.maxPrice !== undefined ||
          patch.sort !== undefined ||
          patch.inStock !== undefined ||
          patch.concerns !== undefined ||
          patch.skinTypes !== undefined ||
          patch.ingredients !== undefined ||
          patch.features !== undefined ||
          patch.ratingMin !== undefined ||
          patch.onSale !== undefined ||
          patch.isNew !== undefined ||
          patch.isBestseller !== undefined ||
          patch.origin !== undefined)
      ) {
        merged.page = 1;
      }

      const next = serializeCatalogSearchParams(merged);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, {
        scroll: options?.scroll ?? false,
      });
    },
    [params, pathname, router],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const toggleConcern = useCallback(
    (c: SkinConcern) => {
      const set = new Set(params.concerns);
      if (set.has(c)) set.delete(c);
      else set.add(c);
      replace({ concerns: [...set] });
    },
    [params.concerns, replace],
  );

  const toggleSkinType = useCallback(
    (s: SkinType) => {
      const set = new Set(params.skinTypes);
      if (set.has(s)) set.delete(s);
      else set.add(s);
      replace({ skinTypes: [...set] });
    },
    [params.skinTypes, replace],
  );

  const toggleList = useCallback(
    (key: "ingredients" | "features", value: string) => {
      const current = params[key];
      const set = new Set(current);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      replace({ [key]: [...set] });
    },
    [params, replace],
  );

  const setCategory = useCallback(
    (category?: CategorySlug) => replace({ category }),
    [replace],
  );

  const setSort = useCallback(
    (sort: CatalogSort) => replace({ sort }),
    [replace],
  );

  const hasActiveFilters = Boolean(
    params.q ||
      params.category ||
      params.productType ||
      params.brand ||
      params.minPrice != null ||
      params.maxPrice != null ||
      params.inStock ||
      params.concerns.length ||
      params.skinTypes.length ||
      params.ingredients.length ||
      params.features.length ||
      params.ratingMin != null ||
      params.onSale ||
      params.isNew ||
      params.isBestseller ||
      params.origin,
  );

  return {
    params,
    replace,
    clearAll,
    toggleConcern,
    toggleSkinType,
    toggleList,
    setCategory,
    setSort,
    hasActiveFilters,
  };
}
