import {
  getAllProducts,
  resolveProductsByIdsOrSlugs as resolveFromDb,
} from "@/lib/catalog";
import type { CategorySlug, Product, SkinConcern } from "@/types";

/** كتالوج مضغوط للنموذج — من قاعدة البيانات */
export async function getCatalogForPrompt() {
  const products = await getAllProducts();
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameAr: p.nameAr,
    category: p.category,
    priceIQD: p.price,
    size: p.size,
    concerns: p.concerns,
    benefitsAr: p.benefitsAr.slice(0, 4),
    ingredients: p.ingredients.slice(0, 8),
    descriptionAr: p.descriptionAr.slice(0, 160),
    isBestseller: !!p.isBestseller,
    isNew: !!p.isNew,
  }));
}

export type CatalogSearchInput = {
  query?: string;
  category?: CategorySlug | "all";
  concerns?: SkinConcern[];
  maxPriceIQD?: number;
  minPriceIQD?: number;
  bestsellersOnly?: boolean;
  limit?: number;
};

export async function searchCatalogProducts(
  input: CatalogSearchInput,
): Promise<Product[]> {
  const all = await getAllProducts();
  const q = (input.query || "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 8, 1), 12);

  let list = all.filter((p) => {
    if (input.bestsellersOnly && !p.isBestseller) return false;
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
    if (q) {
      const hay =
        `${p.name} ${p.nameAr} ${p.descriptionAr} ${p.benefitsAr.join(" ")} ${p.ingredients.join(" ")} ${p.category}`.toLowerCase();
      if (!hay.includes(q) && !q.split(/\s+/).some((w) => w.length > 2 && hay.includes(w))) {
        return false;
      }
    }
    return true;
  });

  list = list.sort((a, b) => {
    let sa = (a.isBestseller ? 2 : 0) + (a.isNew ? 1 : 0) + a.rating / 5;
    let sb = (b.isBestseller ? 2 : 0) + (b.isNew ? 1 : 0) + b.rating / 5;
    if (input.concerns?.length) {
      sa += input.concerns.filter((c) => a.concerns.includes(c)).length;
      sb += input.concerns.filter((c) => b.concerns.includes(c)).length;
    }
    return sb - sa;
  });

  return list.slice(0, limit);
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
  }));
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
