import type { Category as DbCategory, Product as DbProduct, Prisma } from "@/generated/prisma/client";
import type { Category, CategorySlug, Currency, Product, SkinConcern, SkinType } from "@/types";
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

/**
 * لا نمرّر data-URL داخل RSC/JSON — يحجّم الكتالوج عشرات الميغابايت.
 * المسارات المحلية والـ data تُخدم عبر /api/media/product/[id].
 * روابط Blob/HTTPS تُمرَّر كما هي.
 */
export function storefrontProductImageUrl(
  productId: string,
  imageUrl: string | null | undefined,
  cacheBust?: number | string,
): string | null {
  if (!imageUrl?.trim()) return null;
  const url = imageUrl.trim();
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  const q = cacheBust !== undefined && cacheBust !== "" ? `?v=${encodeURIComponent(String(cacheBust))}` : "";
  return `/api/media/product/${encodeURIComponent(productId)}${q}`;
}

export function storefrontBrandLogoUrl(
  productId: string,
  brandLogoUrl: string | null | undefined,
  cacheBust?: number | string,
): string | null {
  if (!brandLogoUrl?.trim()) return null;
  const url = brandLogoUrl.trim();
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  const params = new URLSearchParams({ kind: "brandLogo" });
  if (cacheBust !== undefined && cacheBust !== "") params.set("v", String(cacheBust));
  return `/api/media/product/${encodeURIComponent(productId)}?${params}`;
}

/** حقول المستشار — كتالوج غني للتوصية والـ AI بدون جلب الصفحة كاملة */
export const productAdvisorSelect = {
  id: true,
  slug: true,
  name: true,
  nameAr: true,
  categorySlug: true,
  price: true,
  discountPercent: true,
  currency: true,
  size: true,
  isBestseller: true,
  isNew: true,
  rating: true,
  reviews: true,
  imageTone: true,
  imageUrl: true,
  brandName: true,
  concernsJson: true,
  skinTypesJson: true,
  productType: true,
  featureTagsJson: true,
  stock: true,
  descriptionAr: true,
  benefitsJson: true,
  benefitsArJson: true,
  ingredientsJson: true,
} as const;

export type ProductAdvisorRow = Prisma.ProductGetPayload<{
  select: typeof productAdvisorSelect;
}>;

/** حقول القائمة فقط — بدون أوصاف/مكونات ثقيلة (تسريع التنقل) */
export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  nameAr: true,
  categorySlug: true,
  price: true,
  discountPercent: true,
  currency: true,
  size: true,
  isBestseller: true,
  isNew: true,
  rating: true,
  reviews: true,
  imageTone: true,
  imageUrl: true,
  brandName: true,
  concernsJson: true,
  skinTypesJson: true,
  productType: true,
  featureTagsJson: true,
  stock: true,
} as const;

export type ProductCardRow = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

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

/** نسخة غنية للمستشار — أوصاف ومكوّنات للمطابقة الذكية */
export function mapProductAdvisor(row: ProductAdvisorRow): Product {
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
    description: "",
    descriptionAr: row.descriptionAr || "",
    benefits: asStringArray(row.benefitsJson),
    benefitsAr: asStringArray(row.benefitsArJson),
    ingredients: asStringArray(row.ingredientsJson),
    concerns: asStringArray<SkinConcern>(row.concernsJson),
    skinTypes: asStringArray<SkinType>(row.skinTypesJson),
    productType: row.productType || null,
    featureTags: asStringArray(row.featureTagsJson),
    size: row.size,
    isBestseller: row.isBestseller,
    isNew: row.isNew,
    rating: row.rating,
    reviews: row.reviews,
    imageTone: row.imageTone,
    imageUrl: storefrontProductImageUrl(row.id, row.imageUrl),
    brandName: row.brandName || null,
    brandLogoUrl: null,
    stock: row.stock,
  };
}

/** نسخة خفيفة للقوائم / الرئيسية / البحث — تبقى متوافقة مع Product */
export function mapProductCard(row: ProductCardRow): Product {
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
    description: "",
    descriptionAr: "",
    benefits: [],
    benefitsAr: [],
    ingredients: [],
    concerns: asStringArray<SkinConcern>(row.concernsJson),
    skinTypes: asStringArray<SkinType>(row.skinTypesJson),
    productType: row.productType || null,
    featureTags: asStringArray(row.featureTagsJson),
    size: row.size,
    isBestseller: row.isBestseller,
    isNew: row.isNew,
    rating: row.rating,
    reviews: row.reviews,
    imageTone: row.imageTone,
    imageUrl: storefrontProductImageUrl(row.id, row.imageUrl),
    brandName: row.brandName || null,
    brandLogoUrl: null,
    stock: row.stock,
  };
}

export function mapProduct(row: DbProduct): Product {
  const discountPercent = row.discountPercent || 0;
  const base = row.price;
  const sale = salePriceFromBase(base, discountPercent);
  const brandLogo = row.brandLogoUrl;

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
    skinTypes: asStringArray<SkinType>(row.skinTypesJson),
    productType: row.productType || null,
    featureTags: asStringArray(row.featureTagsJson),
    size: row.size,
    isBestseller: row.isBestseller,
    isNew: row.isNew,
    rating: row.rating,
    reviews: row.reviews,
    imageTone: row.imageTone,
    imageUrl: storefrontProductImageUrl(row.id, row.imageUrl),
    brandName: row.brandName || null,
    brandLogoUrl: storefrontBrandLogoUrl(row.id, brandLogo),
    stock: row.stock,
  };
}
