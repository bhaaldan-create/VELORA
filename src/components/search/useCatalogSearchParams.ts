"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  mergeCatalogSearchParams,
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

  /**
   * Optimistic SSOT for rapid successive patches.
   * `params` from useSearchParams lags behind router.replace; without this ref,
   * click A then click B merges both against the same stale URL and drops A.
   */
  const latestRef = useRef(params);
  useEffect(() => {
    latestRef.current = params;
  }, [params]);

  const replace = useCallback(
    (patch: Partial<CatalogSearchParams>, options?: { scroll?: boolean }) => {
      const merged = mergeCatalogSearchParams(latestRef.current, patch);
      latestRef.current = merged;

      const next = serializeCatalogSearchParams(merged);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, {
        scroll: options?.scroll ?? false,
      });
    },
    [pathname, router],
  );

  const clearAll = useCallback(() => {
    latestRef.current = parseCatalogSearchParams(new URLSearchParams());
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const toggleConcern = useCallback(
    (c: SkinConcern) => {
      const set = new Set(latestRef.current.concerns);
      if (set.has(c)) set.delete(c);
      else set.add(c);
      replace({ concerns: [...set] });
    },
    [replace],
  );

  const toggleSkinType = useCallback(
    (s: SkinType) => {
      const set = new Set(latestRef.current.skinTypes);
      if (set.has(s)) set.delete(s);
      else set.add(s);
      replace({ skinTypes: [...set] });
    },
    [replace],
  );

  const toggleList = useCallback(
    (key: "ingredients" | "features", value: string) => {
      const current = latestRef.current[key];
      const set = new Set(current);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      replace({ [key]: [...set] });
    },
    [replace],
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
