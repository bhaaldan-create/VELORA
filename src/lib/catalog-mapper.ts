import type { Category as DbCategory, Product as DbProduct, Prisma } from "@/generated/prisma/client";
import type { Category, CategorySlug, Currency, Product, SkinConcern } from "@/types";
import { salePriceFromBase } from "@/lib/pricing";

function asStringArray<T = string>(value: Prisma.JsonValue): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function mapCategory(row: DbCategory): Category {
  return {
    slug: row.slug as CategorySlug,
    name: row.name,
    nameAr: row.nameAr,
    description: row.description,
    descriptionAr: row.descriptionAr,
    tagline: row.tagline,
    taglineAr: row.taglineAr,
  };
}

export function mapProduct(row: DbProduct): Product {
  const discountPercent = row.discountPercent || 0;
  const base = row.price;
  const sale = salePriceFromBase(base, discountPercent);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.nameAr,
    category: row.categorySlug as CategorySlug,
    price: sale,
    originalPrice: discountPercent > 0 ? base : undefined,
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    currency: (row.currency as Currency) || "IQD",
    description: row.description,
    descriptionAr: row.descriptionAr,
    benefits: asStringArray(row.benefitsJson),
    benefitsAr: asStringArray(row.benefitsArJson),
    ingredients: asStringArray(row.ingredientsJson),
    concerns: asStringArray<SkinConcern>(row.concernsJson),
    size: row.size,
    isBestseller: row.isBestseller,
    isNew: row.isNew,
    rating: row.rating,
    reviews: row.reviews,
    imageTone: row.imageTone,
    imageUrl: row.imageUrl,
    brandName: row.brandName || null,
    brandLogoUrl: row.brandLogoUrl || null,
    stock: row.stock,
  };
}
