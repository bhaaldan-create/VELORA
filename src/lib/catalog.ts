import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { mapCategory, mapProduct } from "@/lib/catalog-mapper";
import { isFragranceProduct } from "@/lib/product-brand";
import {
  CACHE_TAGS,
  STOREFRONT_REVALIDATE_SECONDS,
} from "@/lib/cache-tags";
import type { Category, Product } from "@/types";

function withoutFragranceProducts(products: Product[]): Product[] {
  return products.filter((p) => !isFragranceProduct(p));
}

const catalogCache = {
  revalidate: STOREFRONT_REVALIDATE_SECONDS,
  tags: [CACHE_TAGS.catalog, CACHE_TAGS.products, CACHE_TAGS.categories],
};

export async function getAllCategories(): Promise<Category[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return rows.map(mapCategory);
    },
    ["catalog-categories"],
    { ...catalogCache, tags: [...catalogCache.tags, CACHE_TAGS.categories] },
  )();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return unstable_cache(
    async () => {
      const row = await prisma.category.findUnique({ where: { slug } });
      return row ? mapCategory(row) : null;
    },
    ["catalog-category", slug],
    catalogCache,
  )();
}

export async function getAllProducts(): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ isBestseller: "desc" }, { nameAr: "asc" }],
      });
      return withoutFragranceProducts(rows.map(mapProduct));
    },
    ["catalog-all-products"],
    catalogCache,
  )();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return unstable_cache(
    async () => {
      const row = await prisma.product.findFirst({
        where: { slug, isActive: true },
      });
      const product = row ? mapProduct(row) : null;
      if (product && isFragranceProduct(product)) return null;
      return product;
    },
    ["catalog-product-slug", slug],
    {
      revalidate: STOREFRONT_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog, CACHE_TAGS.product(slug)],
    },
  )();
}

export async function getProductById(id: string): Promise<Product | null> {
  return unstable_cache(
    async () => {
      const row = await prisma.product.findFirst({
        where: { id, isActive: true },
      });
      const product = row ? mapProduct(row) : null;
      if (product && isFragranceProduct(product)) return null;
      return product;
    },
    ["catalog-product-id", id],
    catalogCache,
  )();
}

export async function getProductsByCategory(
  category?: string,
): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(category ? { categorySlug: category } : {}),
        },
        orderBy: [{ isBestseller: "desc" }, { nameAr: "asc" }],
      });
      return withoutFragranceProducts(rows.map(mapProduct));
    },
    ["catalog-products-category", category ?? "all"],
    catalogCache,
  )();
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [{ isBestseller: true }, { isNew: true }],
        },
        orderBy: [{ isBestseller: "desc" }, { isNew: "desc" }],
        take: limit,
      });
      return withoutFragranceProducts(rows.map(mapProduct));
    },
    ["catalog-featured", String(limit)],
    catalogCache,
  )();
}

export async function getNewArrivals(limit = 12): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: { isActive: true, isNew: true },
        orderBy: [{ updatedAt: "desc" }, { nameAr: "asc" }],
        take: limit,
      });
      if (rows.length >= 4) {
        return withoutFragranceProducts(rows.map(mapProduct));
      }

      const fallback = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ createdAt: "desc" }, { nameAr: "asc" }],
        take: limit,
      });
      return withoutFragranceProducts(fallback.map(mapProduct));
    },
    ["catalog-new-arrivals", String(limit)],
    catalogCache,
  )();
}

export async function getBestsellers(limit = 12): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: { isActive: true, isBestseller: true },
        orderBy: [{ rating: "desc" }, { reviews: "desc" }],
        take: limit,
      });
      if (rows.length >= 4) {
        return withoutFragranceProducts(rows.map(mapProduct));
      }

      const fallback = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ rating: "desc" }, { reviews: "desc" }],
        take: limit,
      });
      return withoutFragranceProducts(fallback.map(mapProduct));
    },
    ["catalog-bestsellers", String(limit)],
    catalogCache,
  )();
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return getAllProducts();

  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
            { descriptionAr: { contains: q, mode: "insensitive" } },
            { categorySlug: { contains: q.toLowerCase() } },
          ],
        },
        orderBy: [{ isBestseller: "desc" }, { nameAr: "asc" }],
      });
      return withoutFragranceProducts(rows.map(mapProduct));
    },
    ["catalog-search", q.toLowerCase()],
    catalogCache,
  )();
}

export async function getProductSlugs(): Promise<string[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    },
    ["catalog-product-slugs"],
    catalogCache,
  )();
}

export async function resolveProductsByIdsOrSlugs(
  ids: string[],
): Promise<Product[]> {
  const keys = ids.map((id) => id.trim()).filter(Boolean);
  if (!keys.length) return [];

  const cacheKey = keys.join("|").toLowerCase();

  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { id: { in: keys } },
            { slug: { in: keys } },
            { name: { in: keys } },
            { nameAr: { in: keys } },
          ],
        },
      });

      const byKey = new Map<string, Product>();
      for (const row of rows) {
        const product = mapProduct(row);
        byKey.set(product.id.toLowerCase(), product);
        byKey.set(product.slug.toLowerCase(), product);
        byKey.set(product.name.toLowerCase(), product);
        byKey.set(product.nameAr, product);
      }

      const ordered: Product[] = [];
      const seen = new Set<string>();
      for (const key of keys) {
        const product = byKey.get(key.toLowerCase()) || byKey.get(key);
        if (product && !isFragranceProduct(product) && !seen.has(product.id)) {
          seen.add(product.id);
          ordered.push(product);
        }
      }
      return withoutFragranceProducts(ordered);
    },
    ["catalog-resolve", cacheKey],
    catalogCache,
  )();
}

export async function getRelatedProducts(
  product: Product,
  limit = 8,
): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          isActive: true,
          categorySlug: product.category,
          NOT: { id: product.id },
        },
        orderBy: [{ isBestseller: "desc" }, { rating: "desc" }],
        take: limit,
      });
      return withoutFragranceProducts(rows.map(mapProduct));
    },
    ["catalog-related", product.id, String(limit)],
    catalogCache,
  )();
}

export async function getRoutineCompanions(
  product: Product,
  limit = 2,
): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.product.findMany({
        where: {
          isActive: true,
          categorySlug: product.category,
          NOT: { id: product.id },
        },
        orderBy: [{ isBestseller: "desc" }, { isNew: "desc" }],
        take: Math.max(limit * 2, 4),
      });
      return withoutFragranceProducts(rows.map(mapProduct)).slice(0, limit);
    },
    ["catalog-routine", product.id, String(limit)],
    catalogCache,
  )();
}
