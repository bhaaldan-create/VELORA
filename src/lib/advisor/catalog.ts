import {
  getAdvisorProducts,
  resolveProductsByIdsOrSlugs as resolveFromDb,
} from "@/lib/catalog";
import type { CategorySlug, Product, SkinConcern } from "@/types";

/** ملخص خفيف للـ prompt — بدون dump كامل للكتالوج */
export async function getCatalogSummaryForPrompt() {
  const products = await getAdvisorProducts();
  const byCategory: Record<string, number> = {};
  const brands = new Set<string>();
  for (const p of products) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
    if (p.brandName?.trim()) brands.add(p.brandName.trim());
  }
  return {
    total: products.length,
    byCategory,
    brandSample: [...brands].slice(0, 24),
  };
}

/** @deprecated استخدم getCatalogSummaryForPrompt — الإبقاء للتوافق المؤقت */
export async function getCatalogForPrompt() {
  const products = await getAdvisorProducts();
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    category: p.category,
    priceIQD: p.price,
    size: p.size,
    concerns: p.concerns,
    skinTypes: p.skinTypes ?? [],
    productType: p.productType,
    featureTags: (p.featureTags ?? []).slice(0, 6),
    benefitsAr: p.benefitsAr.slice(0, 4),
    ingredients: p.ingredients.slice(0, 8),
    descriptionAr: p.descriptionAr.slice(0, 160),
    isBestseller: !!p.isBestseller,
    isNew: !!p.isNew,
  }));
}

export type CatalogSearchInput = {
  query?: string;
  brand?: string;
  category?: CategorySlug | "all";
  concerns?: SkinConcern[];
  maxPriceIQD?: number;
  minPriceIQD?: number;
  bestsellersOnly?: boolean;
  inStockOnly?: boolean;
  limit?: number;
};

function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[\s,،/\-_]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
}

function productHaystack(p: Product): string {
  return `${p.name} ${p.nameAr} ${p.brandName ?? ""} ${p.descriptionAr} ${p.benefitsAr.join(" ")} ${p.ingredients.join(" ")} ${(p.featureTags ?? []).join(" ")} ${(p.skinTypes ?? []).join(" ")} ${p.productType ?? ""} ${p.category}`.toLowerCase();
}

export async function searchCatalogProducts(
  input: CatalogSearchInput,
): Promise<Product[]> {
  const all = await getAdvisorProducts();
  const q = (input.query || "").trim().toLowerCase();
  const tokens = q ? tokenizeQuery(q) : [];
  const brandQ = (input.brand || "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 12);

  let list = all.filter((p) => {
    if (input.bestsellersOnly && !p.isBestseller) return false;
    if (input.inStockOnly && (p.stock ?? 1) <= 0) return false;
    if (typeof input.maxPriceIQD === "number" && p.price > input.maxPriceIQD) {
      return false;
    }
    if (typeof input.minPriceIQD === "number" && p.price < input.minPriceIQD) {
      return false;
    }
    if (input.category && input.category !== "all") {
      if (p.category !== input.category) return false;
    }
    if (input.concerns?.length) {
      if (!input.concerns.some((c) => p.concerns.includes(c))) return false;
    }
    if (brandQ) {
      const bn = (p.brandName ?? "").toLowerCase();
      const nameHit =
        bn.includes(brandQ) ||
        p.name.toLowerCase().includes(brandQ) ||
        p.nameAr.includes(input.brand!.trim());
      if (!nameHit) return false;
    }
    if (tokens.length) {
      const hay = productHaystack(p);
      const matched = tokens.some((w) => hay.includes(w));
      if (!matched) return false;
    }
    return true;
  });

  list = list.sort((a, b) => {
    let sa = (a.isBestseller ? 2 : 0) + (a.isNew ? 1 : 0) + a.rating / 5;
    let sb = (b.isBestseller ? 2 : 0) + (b.isNew ? 1 : 0) + b.rating / 5;
    if (input.concerns?.length) {
      sa += input.concerns.filter((c) => a.concerns.includes(c)).length * 2;
      sb += input.concerns.filter((c) => b.concerns.includes(c)).length * 2;
    }
    if (tokens.length) {
      const ha = productHaystack(a);
      const hb = productHaystack(b);
      sa += tokens.filter((t) => ha.includes(t)).length;
      sb += tokens.filter((t) => hb.includes(t)).length;
    }
    return sb - sa;
  });

  return list.slice(0, limit);
}

export async function getProductDetailsByIdOrSlug(
  idOrSlug: string,
): Promise<Product | null> {
  const [product] = await resolveFromDb([idOrSlug]);
  return product ?? null;
}

export async function resolveProductsByIdsOrSlugs(
  ids: string[],
): Promise<Product[]> {
  return resolveFromDb(ids);
}

export function toRecommendationPayload(list: Product[]) {
  return list.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    currency: p.currency,
    size: p.size,
    category: p.category,
    benefits: p.benefits,
    benefitsAr: p.benefitsAr,
    ingredients: p.ingredients,
    concerns: p.concerns,
    description: p.description,
    descriptionAr: p.descriptionAr,
    imageTone: p.imageTone,
    imageUrl: p.imageUrl,
    rating: p.rating,
    reviews: p.reviews,
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    brandName: p.brandName ?? null,
    stock: p.stock,
  }));
}

export function toProductDetailPayload(p: Product) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    brandName: p.brandName ?? null,
    category: p.category,
    productType: p.productType ?? null,
    priceIQD: p.price,
    originalPrice: p.originalPrice ?? null,
    discountPercent: p.discountPercent ?? null,
    size: p.size,
    stock: p.stock ?? null,
    inStock: (p.stock ?? 1) > 0,
    concerns: p.concerns,
    skinTypes: p.skinTypes ?? [],
    benefitsAr: p.benefitsAr,
    benefits: p.benefits,
    ingredients: p.ingredients,
    featureTags: p.featureTags ?? [],
    descriptionAr: p.descriptionAr,
    description: p.description,
    rating: p.rating,
    reviews: p.reviews,
    isBestseller: !!p.isBestseller,
    isNew: !!p.isNew,
  };
}

export function extractLatestUserText(
  messages: Array<{
    role: string;
    parts?: Array<{ type: string; text?: string }>;
    content?: string;
  }>,
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (typeof m.content === "string" && m.content.trim()) return m.content.trim();
    if (m.parts?.length) {
      const text = m.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("\n")
        .trim();
      if (text) return text;
    }
  }
  return "";
}
