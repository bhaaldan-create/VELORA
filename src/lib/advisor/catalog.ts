import {
  getAllProducts,
  resolveProductsByIdsOrSlugs as resolveFromDb,
} from "@/lib/catalog";
import type { Product } from "@/types";

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
    benefitsAr: p.benefitsAr,
    ingredients: p.ingredients,
    descriptionAr: p.descriptionAr,
    isBestseller: !!p.isBestseller,
    isNew: !!p.isNew,
  }));
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
