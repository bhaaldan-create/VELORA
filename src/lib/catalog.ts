import { prisma } from "@/lib/db";
import { mapCategory, mapProduct } from "@/lib/catalog-mapper";
import { isFragranceProduct } from "@/lib/product-brand";
import type { Category, Product } from "@/types";

export async function getAllCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const row = await prisma.category.findUnique({ where: { slug } });
  return row ? mapCategory(row) : null;
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isBestseller: "desc" }, { nameAr: "asc" }],
  });
  return rows.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
  });
  return row ? mapProduct(row) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { id, isActive: true },
  });
  return row ? mapProduct(row) : null;
}

export async function getProductsByCategory(
  category?: string,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { categorySlug: category } : {}),
    },
    orderBy: [{ isBestseller: "desc" }, { nameAr: "asc" }],
  });
  return rows.map(mapProduct);
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [{ isBestseller: true }, { isNew: true }],
    },
    orderBy: [{ isBestseller: "desc" }, { isNew: "desc" }],
    take: limit,
  });
  return rows.map(mapProduct);
}

export async function getNewArrivals(limit = 12): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isNew: true },
    orderBy: [{ updatedAt: "desc" }, { nameAr: "asc" }],
    take: limit,
  });
  if (rows.length >= 4) return rows.map(mapProduct);

  const fallback = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "desc" }, { nameAr: "asc" }],
    take: limit,
  });
  return fallback.map(mapProduct);
}

export async function getBestsellers(limit = 12): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isBestseller: true },
    orderBy: [{ rating: "desc" }, { reviews: "desc" }],
    take: limit,
  });
  if (rows.length >= 4) return rows.map(mapProduct);

  const fallback = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ rating: "desc" }, { reviews: "desc" }],
    take: limit,
  });
  return fallback.map(mapProduct);
}

export async function getFragranceProducts(limit = 12): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter(isFragranceProduct).slice(0, limit);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return getAllProducts();

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q, mode: "insensitive" } },
        { descriptionAr: { contains: q, mode: "insensitive" } },
        { categorySlug: { contains: q.toLowerCase() } },
        // Json fields: بحث نصي عبر cast — يُنفَّذ يدوياً إن احتجتِه (انظر قائمة التعديلات اليدوية)
      ],
    },
    orderBy: [{ isBestseller: "desc" }, { nameAr: "asc" }],
  });
  return rows.map(mapProduct);
}

export async function getProductSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function resolveProductsByIdsOrSlugs(
  ids: string[],
): Promise<Product[]> {
  const keys = ids.map((id) => id.trim()).filter(Boolean);
  if (!keys.length) return [];

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
    const product =
      byKey.get(key.toLowerCase()) || byKey.get(key);
    if (product && !seen.has(product.id)) {
      seen.add(product.id);
      ordered.push(product);
    }
  }
  return ordered;
}
