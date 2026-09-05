import type { CategorySlug, SkinConcern, SkinType } from "@/types";

export type CatalogSort =
  | "best-match"
  | "best-selling"
  | "top-rated"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "most-reviewed"
  | "on-sale";

export type CatalogSearchParams = {
  q: string;
  category?: CategorySlug;
  productType?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: CatalogSort;
  inStock?: boolean;
  concerns: SkinConcern[];
  skinTypes: SkinType[];
  ingredients: string[];
  features: string[];
  ratingMin?: number;
  onSale?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  origin?: string;
  page: number;
  pageSize: number;
};

export type CatalogFacets = {
  brands: string[];
  productTypes: string[];
  ingredients: string[];
  concerns: string[];
  skinTypes: string[];
  featureTags: string[];
  origins: { code: string; labelEn: string; labelAr: string }[];
  priceMin: number;
  priceMax: number;
};

export type CatalogSearchResult = {
  products: import("@/types").Product[];
  total: number;
  page: number;
  pageSize: number;
  sort: CatalogSort;
};

const SKIN_TYPES: SkinType[] = [
  "oily",
  "dry",
  "combination",
  "normal",
  "sensitive",
];

const CONCERNS: SkinConcern[] = [
  "hydration",
  "glow",
  "acne",
  "anti-aging",
  "sensitivity",
  "oil-control",
];

const SORTS: CatalogSort[] = [
  "best-match",
  "best-selling",
  "top-rated",
  "newest",
  "price-asc",
  "price-desc",
  "most-reviewed",
  "on-sale",
];

const CATEGORIES: CategorySlug[] = [
  "skincare",
  "body-care",
  "hair-care",
  "makeup",
];

function parseList(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseIntParam(raw: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function parseFloatParam(raw: string | null): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function mergeCatalogSearchParams(
  current: CatalogSearchParams,
  patch: Partial<CatalogSearchParams>,
): CatalogSearchParams {
  const merged: CatalogSearchParams = {
    ...current,
    ...patch,
    concerns: patch.concerns ?? current.concerns,
    skinTypes: patch.skinTypes ?? current.skinTypes,
    ingredients: patch.ingredients ?? current.ingredients,
    features: patch.features ?? current.features,
    page: patch.page ?? current.page,
  };

  const filterChanged =
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
      patch.origin !== undefined);

  if (filterChanged) {
    merged.page = 1;
  }

  return merged;
}

export function parseCatalogSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): CatalogSearchParams {
  const get = (key: string): string | null => {
    if (input instanceof URLSearchParams) return input.get(key);
    const v = input[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  const q = (get("q") || "").trim();
  const categoryRaw = (get("category") || "").trim() as CategorySlug;
  const sortRaw = (get("sort") || "").trim() as CatalogSort;
  const page = Math.max(1, parseIntParam(get("page")) || 1);
  const pageSize = Math.min(
    48,
    Math.max(1, parseIntParam(get("pageSize")) || 24),
  );

  const defaultSort: CatalogSort = q ? "best-match" : "best-selling";

  return {
    q,
    category: CATEGORIES.includes(categoryRaw) ? categoryRaw : undefined,
    productType: (get("productType") || "").trim() || undefined,
    brand: (get("brand") || "").trim() || undefined,
    minPrice: parseIntParam(get("minPrice")),
    maxPrice: parseIntParam(get("maxPrice")),
    sort: SORTS.includes(sortRaw) ? sortRaw : defaultSort,
    inStock: get("inStock") === "1" || get("inStock") === "true",
    concerns: parseList(get("concern")).filter((c): c is SkinConcern =>
      CONCERNS.includes(c as SkinConcern),
    ),
    skinTypes: parseList(get("skinType")).filter((s): s is SkinType =>
      SKIN_TYPES.includes(s as SkinType),
    ),
    ingredients: parseList(get("ingredient")),
    features: parseList(get("feature")),
    ratingMin: parseFloatParam(get("ratingMin")),
    onSale: get("onSale") === "1" || get("onSale") === "true",
    isNew: get("isNew") === "1" || get("isNew") === "true",
    isBestseller:
      get("isBestseller") === "1" || get("isBestseller") === "true",
    origin: (get("origin") || "").trim().toUpperCase() || undefined,
    page,
    pageSize,
  };
}

export function serializeCatalogSearchParams(
  params: Partial<CatalogSearchParams>,
  base?: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(base?.toString());
  const setOrDelete = (key: string, value: string | undefined) => {
    if (!value) next.delete(key);
    else next.set(key, value);
  };

  setOrDelete("q", params.q?.trim() || undefined);
  setOrDelete("category", params.category);
  setOrDelete("productType", params.productType);
  setOrDelete("brand", params.brand);
  setOrDelete(
    "minPrice",
    params.minPrice != null ? String(params.minPrice) : undefined,
  );
  setOrDelete(
    "maxPrice",
    params.maxPrice != null ? String(params.maxPrice) : undefined,
  );
  setOrDelete("sort", params.sort);
  setOrDelete("inStock", params.inStock ? "1" : undefined);
  setOrDelete(
    "concern",
    params.concerns?.length ? params.concerns.join(",") : undefined,
  );
  setOrDelete(
    "skinType",
    params.skinTypes?.length ? params.skinTypes.join(",") : undefined,
  );
  setOrDelete(
    "ingredient",
    params.ingredients?.length ? params.ingredients.join(",") : undefined,
  );
  setOrDelete(
    "feature",
    params.features?.length ? params.features.join(",") : undefined,
  );
  setOrDelete(
    "ratingMin",
    params.ratingMin != null ? String(params.ratingMin) : undefined,
  );
  setOrDelete("onSale", params.onSale ? "1" : undefined);
  setOrDelete("isNew", params.isNew ? "1" : undefined);
  setOrDelete("isBestseller", params.isBestseller ? "1" : undefined);
  setOrDelete("origin", params.origin);
  if (params.page && params.page > 1) next.set("page", String(params.page));
  else next.delete("page");

  return next;
}
