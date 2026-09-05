import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  mapProductCard,
  productCardSelect,
} from "@/lib/catalog-mapper";
import { isFragranceProduct } from "@/lib/product-brand";
import {
  CACHE_TAGS,
  STOREFRONT_REVALIDATE_SECONDS,
} from "@/lib/cache-tags";
import { salePriceFromBase } from "@/lib/pricing";
import { shopBrands } from "@/data/shop-brands";
import type {
  CatalogFacets,
  CatalogSearchParams,
  CatalogSearchResult,
  CatalogSort,
} from "@/lib/catalog-search-params";
import type { CategorySlug, Product } from "@/types";

export type {
  CatalogFacets,
  CatalogSearchParams,
  CatalogSearchResult,
  CatalogSort,
} from "@/lib/catalog-search-params";
export {
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
} from "@/lib/catalog-search-params";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function brandOriginCodes(brandName: string | null | undefined): string[] {
  if (!brandName) return [];
  const lower = brandName.toLowerCase();
  return shopBrands
    .filter(
      (b) =>
        b.name.toLowerCase() === lower ||
        b.match.some((m) => lower.includes(m) || m.includes(lower)),
    )
    .map((b) => b.countryCode);
}

function jsonArrayHasAny(field: string, values: string[]): Prisma.Sql | null {
  if (!values.length) return null;
  // Post-filter fallback — Prisma JSON array contains is limited; we filter in memory after fetch for JSON facets
  void field;
  return null;
}

function buildWhere(params: CatalogSearchParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];

  if (params.category) and.push({ categorySlug: params.category });
  if (params.productType) {
    and.push({
      productType: { equals: params.productType, mode: "insensitive" },
    });
  }
  if (params.brand) {
    const brandMeta = shopBrands.find(
      (b) =>
        b.slug === params.brand ||
        b.name.toLowerCase() === params.brand!.toLowerCase() ||
        b.match.some((m) => m.toLowerCase() === params.brand!.toLowerCase()),
    );
    if (brandMeta) {
      const tokens = Array.from(
        new Set(
          [brandMeta.name, ...brandMeta.match]
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      );
      // Brand filter MUST only constrain Product.brandName — never product title.
      // Matching name/nameAr made brand filters behave like free-text search.
      and.push({
        OR: [
          {
            brandName: {
              equals: brandMeta.name,
              mode: "insensitive" as const,
            },
          },
          ...tokens.map((token) => ({
            brandName: { contains: token, mode: "insensitive" as const },
          })),
        ],
      });
    } else {
      and.push({
        brandName: { contains: params.brand, mode: "insensitive" },
      });
    }
  }
  if (params.inStock) and.push({ stock: { gt: 0 } });
  if (params.onSale) and.push({ discountPercent: { gt: 0 } });
  if (params.isNew) and.push({ isNew: true });
  if (params.isBestseller) and.push({ isBestseller: true });
  if (params.ratingMin != null) and.push({ rating: { gte: params.ratingMin } });

  // Price filter uses base price; sale price adjusted in post-filter for accuracy
  if (params.minPrice != null || params.maxPrice != null) {
    const price: Prisma.IntFilter = {};
    if (params.minPrice != null) price.gte = Math.max(0, params.minPrice);
    if (params.maxPrice != null) price.lte = params.maxPrice;
    and.push({ price: price });
  }

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { descriptionAr: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { categorySlug: { contains: q.toLowerCase() } },
        { productType: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  void jsonArrayHasAny;
  return { AND: and };
}

function prismaOrderBy(
  sort: CatalogSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { nameAr: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { nameAr: "asc" }];
    case "top-rated":
      return [{ rating: "desc" }, { reviews: "desc" }];
    case "newest":
      return [{ updatedAt: "desc" }, { createdAt: "desc" }];
    case "most-reviewed":
      return [{ reviews: "desc" }, { rating: "desc" }];
    case "on-sale":
      return [{ discountPercent: "desc" }, { isBestseller: "desc" }];
    case "best-selling":
      return [{ isBestseller: "desc" }, { reviews: "desc" }, { rating: "desc" }];
    case "best-match":
    default:
      return [{ isBestseller: "desc" }, { rating: "desc" }, { nameAr: "asc" }];
  }
}

function relevanceScore(product: Product, q: string): number {
  if (!q) return 0;
  const needle = q.toLowerCase();
  let score = 0;
  if (product.name.toLowerCase() === needle) score += 100;
  if (product.nameAr === q) score += 100;
  if (product.name.toLowerCase().startsWith(needle)) score += 40;
  if (product.nameAr.startsWith(q)) score += 40;
  if (product.name.toLowerCase().includes(needle)) score += 20;
  if (product.nameAr.includes(q)) score += 20;
  if (product.brandName?.toLowerCase().includes(needle)) score += 15;
  if (product.productType?.toLowerCase().includes(needle)) score += 12;
  if (product.category.includes(needle)) score += 8;
  if (product.ingredients.some((i) => i.toLowerCase().includes(needle)))
    score += 10;
  if (product.concerns.some((c) => c.includes(needle))) score += 8;
  if (product.isBestseller) score += 5;
  if (product.isNew) score += 2;
  score += product.rating;
  return score;
}

function passesJsonFilters(
  row: {
    ingredientsJson: unknown;
    concernsJson: unknown;
    skinTypesJson: unknown;
    featureTagsJson: unknown;
    brandName: string | null;
    discountPercent: number;
    price: number;
  },
  params: CatalogSearchParams,
): boolean {
  const ingredients = asStringArray(row.ingredientsJson).map((s) =>
    s.toLowerCase(),
  );
  const concerns = asStringArray(row.concernsJson);
  const skinTypes = asStringArray(row.skinTypesJson);
  const features = asStringArray(row.featureTagsJson).map((s) =>
    s.toLowerCase(),
  );

  if (params.concerns.length) {
    if (!params.concerns.every((c) => concerns.includes(c))) return false;
  }
  if (params.skinTypes.length) {
    if (!params.skinTypes.some((s) => skinTypes.includes(s))) return false;
  }
  if (params.ingredients.length) {
    if (
      !params.ingredients.every((ing) =>
        ingredients.some((i) => i.includes(ing.toLowerCase())),
      )
    ) {
      return false;
    }
  }
  if (params.features.length) {
    if (
      !params.features.every((f) => features.includes(f.toLowerCase()))
    ) {
      return false;
    }
  }
  if (params.origin) {
    const codes = brandOriginCodes(row.brandName);
    if (!codes.includes(params.origin)) return false;
  }

  // Sale-price range refinement (DB used base price)
  const sale = salePriceFromBase(row.price, row.discountPercent || 0);
  if (params.minPrice != null && sale < params.minPrice) return false;
  if (params.maxPrice != null && sale > params.maxPrice) return false;

  if (params.q) {
    const q = params.q.toLowerCase();
    const hay = [
      ...ingredients,
      ...concerns,
      ...skinTypes,
      ...features,
    ].join(" ");
    // If text matched only via JSON fields, allow when hay contains q
    // (SQL already matched name/brand/etc; this is extra)
    void hay;
    void q;
  }

  return true;
}

const searchSelect = {
  ...productCardSelect,
  ingredientsJson: true,
  description: true,
  descriptionAr: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function searchCatalog(
  params: CatalogSearchParams,
): Promise<CatalogSearchResult> {
  const cacheKey = JSON.stringify(params);

  return unstable_cache(
    async () => {
      const where = buildWhere(params);
      const needsJsonPost =
        params.concerns.length > 0 ||
        params.skinTypes.length > 0 ||
        params.ingredients.length > 0 ||
        params.features.length > 0 ||
        !!params.origin ||
        params.minPrice != null ||
        params.maxPrice != null;

      const rows = await prisma.product.findMany({
        where,
        orderBy: prismaOrderBy(params.sort),
        select: searchSelect,
        // Fetch a wider window when post-filtering; otherwise page in DB
        take: needsJsonPost ? 500 : params.pageSize,
        skip: needsJsonPost ? 0 : (params.page - 1) * params.pageSize,
      });

      let filtered = rows.filter((row) => {
        if (isFragranceProduct({ name: row.name, nameAr: row.nameAr, category: row.categorySlug as CategorySlug } as Product)) {
          return false;
        }
        return passesJsonFilters(row, params);
      });

      if (params.sort === "best-match" && params.q) {
        filtered = filtered
          .map((row) => ({
            row,
            score: relevanceScore(mapProductCard(row), params.q),
          }))
          .sort((a, b) => b.score - a.score)
          .map((x) => x.row);
      }

      const total = needsJsonPost
        ? filtered.length
        : await prisma.product.count({ where });

      const pageRows = needsJsonPost
        ? filtered.slice(
            (params.page - 1) * params.pageSize,
            params.page * params.pageSize,
          )
        : filtered;

      return {
        products: pageRows.map(mapProductCard),
        total: needsJsonPost ? filtered.length : total,
        page: params.page,
        pageSize: params.pageSize,
        sort: params.sort,
      };
    },
    ["catalog-advanced-search-v2", cacheKey],
    {
      revalidate: STOREFRONT_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog, CACHE_TAGS.products],
    },
  )();
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          brandName: true,
          productType: true,
          ingredientsJson: true,
          concernsJson: true,
          skinTypesJson: true,
          featureTagsJson: true,
          price: true,
          discountPercent: true,
          name: true,
          nameAr: true,
          categorySlug: true,
        },
      });

      const brands = new Set<string>();
      const productTypes = new Set<string>();
      const ingredients = new Set<string>();
      const concerns = new Set<string>();
      const skinTypes = new Set<string>();
      const featureTags = new Set<string>();
      const origins = new Map<
        string,
        { code: string; labelEn: string; labelAr: string }
      >();
      let priceMin = Number.POSITIVE_INFINITY;
      let priceMax = 0;

      for (const row of rows) {
        if (
          isFragranceProduct({
            name: row.name,
            nameAr: row.nameAr,
            category: row.categorySlug as CategorySlug,
          } as Product)
        ) {
          continue;
        }
        if (row.brandName?.trim()) brands.add(row.brandName.trim());
        if (row.productType?.trim()) productTypes.add(row.productType.trim());
        for (const i of asStringArray(row.ingredientsJson)) ingredients.add(i);
        for (const c of asStringArray(row.concernsJson)) concerns.add(c);
        for (const s of asStringArray(row.skinTypesJson)) skinTypes.add(s);
        for (const f of asStringArray(row.featureTagsJson)) featureTags.add(f);
        const sale = salePriceFromBase(row.price, row.discountPercent || 0);
        priceMin = Math.min(priceMin, sale);
        priceMax = Math.max(priceMax, sale);
        for (const code of brandOriginCodes(row.brandName)) {
          const meta = shopBrands.find((b) => b.countryCode === code);
          if (meta && !origins.has(code)) {
            origins.set(code, {
              code,
              labelEn: meta.country,
              labelAr: meta.countryAr,
            });
          }
        }
      }

      return {
        brands: [...brands].sort((a, b) => a.localeCompare(b)),
        productTypes: [...productTypes].sort((a, b) => a.localeCompare(b)),
        ingredients: [...ingredients].sort((a, b) => a.localeCompare(b)),
        concerns: [...concerns],
        skinTypes: [...skinTypes],
        featureTags: [...featureTags].sort((a, b) => a.localeCompare(b)),
        origins: [...origins.values()],
        priceMin: Number.isFinite(priceMin) ? priceMin : 0,
        priceMax: priceMax || 0,
      };
    },
    ["catalog-facets-v1"],
    {
      revalidate: STOREFRONT_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog, CACHE_TAGS.products],
    },
  )();
}

export type CatalogSuggestResult = {
  products: Product[];
  brands: { name: string; nameAr: string; slug: string; href: string }[];
  categories: { slug: CategorySlug; name: string; nameAr: string }[];
};

export async function suggestCatalog(qRaw: string): Promise<CatalogSuggestResult> {
  const q = qRaw.trim();
  if (!q) {
    return { products: [], brands: [], categories: [] };
  }

  const qLower = q.toLowerCase();

  // Lightweight product suggest — avoid full advanced search pipeline
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { productType: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ isBestseller: "desc" }, { rating: "desc" }],
    take: 8,
    select: productCardSelect,
  });

  const products = rows
    .filter(
      (row) =>
        !isFragranceProduct({
          name: row.name,
          nameAr: row.nameAr,
          category: row.categorySlug as CategorySlug,
        } as Product),
    )
    .slice(0, 6)
    .map(mapProductCard);

  const brands = shopBrands
    .filter(
      (b) =>
        b.name.toLowerCase().includes(qLower) ||
        b.nameAr.includes(q) ||
        b.match.some((m) => m.includes(qLower)),
    )
    .slice(0, 6)
    .map((b) => ({
      name: b.name,
      nameAr: b.nameAr,
      slug: b.slug,
      href: `/shop?brand=${encodeURIComponent(b.slug)}`,
    }));

  const categoryDefs: { slug: CategorySlug; name: string; nameAr: string }[] = [
    { slug: "skincare", name: "Skincare", nameAr: "العناية بالبشرة" },
    { slug: "body-care", name: "Body Care", nameAr: "العناية بالجسم" },
    { slug: "hair-care", name: "Hair Care", nameAr: "العناية بالشعر" },
    { slug: "makeup", name: "Makeup", nameAr: "المكياج" },
  ];
  const categories = categoryDefs
    .filter(
      (c) =>
        c.slug.includes(qLower) ||
        c.name.toLowerCase().includes(qLower) ||
        c.nameAr.includes(q),
    )
    .slice(0, 4);

  return {
    products,
    brands,
    categories,
  };
}

/** Architecture stub — do not expose fake match % in UI */
export type VeloraMatchStub = {
  enabled: false;
  reason: "match-engine-not-ready";
};

export const VELORA_MATCH_STUB: VeloraMatchStub = {
  enabled: false,
  reason: "match-engine-not-ready",
};
