import { prisma } from "@/lib/db";
import type {
  AdminProduct,
  AdminProductDetail,
} from "@/lib/admin-product-types";
import { writeAuditLog } from "@/lib/finance/audit";
import { computeLandedCostIqd } from "@/lib/finance/product-cost";
import { salePriceFromBase } from "@/lib/pricing";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import type { CategorySlug, SkinConcern } from "@/types";

export type {
  AdminProduct,
  AdminProductDetail,
  AdminProductStats,
} from "@/lib/admin-product-types";
export {
  countAdminProductStats,
  ADMIN_CATEGORY_LABELS,
} from "@/lib/admin-product-types";

const DEFAULT_TONE =
  "linear-gradient(145deg, #E8D5D8 0%, #C9A8B0 45%, #3D2640 100%)";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function toAdminProduct(row: {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  categorySlug: string;
  price: number;
  discountPercent: number;
  stock: number;
  isActive: boolean;
  isBestseller: boolean;
  isNew: boolean;
  size: string;
  imageUrl: string | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  updatedAt: Date;
}): AdminProduct {
  const discountPercent = row.discountPercent || 0;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.nameAr,
    categorySlug: row.categorySlug,
    price: row.price,
    discountPercent,
    salePrice: salePriceFromBase(row.price, discountPercent),
    stock: row.stock,
    isActive: row.isActive,
    isBestseller: row.isBestseller,
    isNew: row.isNew,
    size: row.size,
    imageUrl: row.imageUrl,
    brandName: row.brandName,
    brandLogoUrl: row.brandLogoUrl,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAdminProductDetail(row: {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  categorySlug: string;
  price: number;
  discountPercent: number;
  stock: number;
  isActive: boolean;
  isBestseller: boolean;
  isNew: boolean;
  size: string;
  imageUrl: string | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  updatedAt: Date;
  description: string;
  descriptionAr: string;
  benefitsJson: unknown;
  benefitsArJson: unknown;
  ingredientsJson: unknown;
  concernsJson: unknown;
  supplierId: string | null;
  costCurrency: string;
  costExchangeRate: number;
  purchasePrice: number;
  shippingCostIqd: number;
  customsCostIqd: number;
  brokerageCostIqd: number;
  handlingCostIqd: number;
  otherCostIqd: number;
  landedCostIqd: number;
  minMarginPct: number;
}): AdminProductDetail {
  return {
    ...toAdminProduct(row),
    description: row.description,
    descriptionAr: row.descriptionAr,
    benefits: asStringArray(row.benefitsJson),
    benefitsAr: asStringArray(row.benefitsArJson),
    ingredients: asStringArray(row.ingredientsJson),
    concerns: asStringArray(row.concernsJson),
    supplierId: row.supplierId,
    costCurrency: row.costCurrency,
    costExchangeRate: row.costExchangeRate,
    purchasePrice: row.purchasePrice,
    shippingCostIqd: row.shippingCostIqd,
    customsCostIqd: row.customsCostIqd,
    brokerageCostIqd: row.brokerageCostIqd,
    handlingCostIqd: row.handlingCostIqd,
    otherCostIqd: row.otherCostIqd,
    landedCostIqd: row.landedCostIqd,
    minMarginPct: row.minMarginPct,
  };
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await prisma.product.findMany({
    orderBy: [{ categorySlug: "asc" }, { nameAr: "asc" }],
  });
  return rows.map(toAdminProduct);
}

export async function getAdminProductById(
  id: string,
): Promise<AdminProductDetail | null> {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) return null;
  return toAdminProductDetail(row);
}

export type AdminProductUpdate = {
  name?: string;
  nameAr?: string;
  price?: number;
  stock?: number;
  discountPercent?: number;
  isActive?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  imageUrl?: string | null;
  brandName?: string | null;
  brandLogoUrl?: string | null;
  categorySlug?: string;
  size?: string;
  description?: string;
  descriptionAr?: string;
  benefits?: string[];
  benefitsAr?: string[];
  ingredients?: string[];
  concerns?: string[];
  rating?: number;
  reviews?: number;
  imageTone?: string;
  slug?: string;
  supplierId?: string | null;
  costCurrency?: string;
  costExchangeRate?: number;
  purchasePrice?: number;
  shippingCostIqd?: number;
  customsCostIqd?: number;
  brokerageCostIqd?: number;
  handlingCostIqd?: number;
  otherCostIqd?: number;
  minMarginPct?: number;
};

export type AdminProductCreateInput = {
  name: string;
  nameAr: string;
  categorySlug: CategorySlug;
  price: number;
  stock?: number;
  discountPercent?: number;
  size: string;
  description: string;
  descriptionAr: string;
  benefits: string[];
  benefitsAr: string[];
  ingredients: string[];
  concerns: SkinConcern[];
  isActive?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  imageTone?: string;
  slug?: string;
  brandName?: string | null;
  brandLogoUrl?: string | null;
};

function slugify(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `product-${Date.now().toString(36)}`;
}

async function uniqueSlug(desired: string) {
  let slug = slugify(desired);
  let n = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${slugify(desired)}-${n}`;
    n += 1;
  }
  return slug;
}

function cleanList(items: string[]) {
  return items.map((s) => s.trim()).filter(Boolean);
}

export async function createAdminProduct(
  data: AdminProductCreateInput,
): Promise<AdminProduct> {
  const category = await prisma.category.findUnique({
    where: { slug: data.categorySlug },
  });
  if (!category) {
    throw new Error("التصنيف غير موجود.");
  }

  const slug = await uniqueSlug(data.slug?.trim() || data.name);
  const id = `p${Date.now().toString(36)}`;

  const row = await prisma.product.create({
    data: {
      id,
      slug,
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      categorySlug: data.categorySlug,
      price: Math.round(data.price),
      discountPercent: Math.round(data.discountPercent ?? 0),
      currency: "IQD",
      description: data.description.trim(),
      descriptionAr: data.descriptionAr.trim(),
      benefitsJson: cleanList(data.benefits),
      benefitsArJson: cleanList(data.benefitsAr),
      ingredientsJson: cleanList(data.ingredients),
      concernsJson: data.concerns,
      size: data.size.trim() || "—",
      isBestseller: !!data.isBestseller,
      isNew: data.isNew !== false,
      rating: typeof data.rating === "number" ? data.rating : 5,
      reviews: typeof data.reviews === "number" ? Math.round(data.reviews) : 0,
      imageTone: data.imageTone?.trim() || DEFAULT_TONE,
      brandName: data.brandName?.trim() || null,
      brandLogoUrl: data.brandLogoUrl || null,
      stock: Math.round(data.stock ?? 100),
      isActive: data.isActive !== false,
    },
  });

  revalidateStorefront({ slug: row.slug });
  return toAdminProduct(row);
}

export async function updateAdminProduct(
  id: string,
  data: AdminProductUpdate,
): Promise<AdminProduct | null> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  if (data.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: data.categorySlug },
    });
    if (!category) throw new Error("التصنيف غير موجود.");
  }

  let nextSlug: string | undefined;
  if (typeof data.slug === "string" && data.slug.trim()) {
    const desired = slugify(data.slug);
    if (desired !== existing.slug) {
      nextSlug = await uniqueSlug(desired);
    }
  }

  const row = await prisma.product.update({
    where: { id },
    data: {
      ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
      ...(typeof data.nameAr === "string" ? { nameAr: data.nameAr.trim() } : {}),
      ...(typeof data.price === "number" ? { price: Math.round(data.price) } : {}),
      ...(typeof data.stock === "number" ? { stock: Math.round(data.stock) } : {}),
      ...(typeof data.discountPercent === "number"
        ? { discountPercent: Math.round(data.discountPercent) }
        : {}),
      ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
      ...(typeof data.isBestseller === "boolean"
        ? { isBestseller: data.isBestseller }
        : {}),
      ...(typeof data.isNew === "boolean" ? { isNew: data.isNew } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.brandName !== undefined
        ? {
            brandName:
              typeof data.brandName === "string"
                ? data.brandName.trim() || null
                : null,
          }
        : {}),
      ...(data.brandLogoUrl !== undefined
        ? { brandLogoUrl: data.brandLogoUrl }
        : {}),
      ...(data.categorySlug ? { categorySlug: data.categorySlug } : {}),
      ...(typeof data.size === "string" ? { size: data.size.trim() } : {}),
      ...(typeof data.description === "string"
        ? { description: data.description.trim() }
        : {}),
      ...(typeof data.descriptionAr === "string"
        ? { descriptionAr: data.descriptionAr.trim() }
        : {}),
      ...(data.benefits ? { benefitsJson: cleanList(data.benefits) } : {}),
      ...(data.benefitsAr ? { benefitsArJson: cleanList(data.benefitsAr) } : {}),
      ...(data.ingredients
        ? { ingredientsJson: cleanList(data.ingredients) }
        : {}),
      ...(data.concerns ? { concernsJson: data.concerns } : {}),
      ...(typeof data.rating === "number" ? { rating: data.rating } : {}),
      ...(typeof data.reviews === "number"
        ? { reviews: Math.round(data.reviews) }
        : {}),
      ...(typeof data.imageTone === "string"
        ? { imageTone: data.imageTone.trim() || DEFAULT_TONE }
        : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
      ...(typeof data.costCurrency === "string"
        ? { costCurrency: data.costCurrency.toUpperCase() }
        : {}),
      ...(typeof data.costExchangeRate === "number"
        ? { costExchangeRate: data.costExchangeRate }
        : {}),
      ...(typeof data.purchasePrice === "number"
        ? { purchasePrice: data.purchasePrice }
        : {}),
      ...(typeof data.shippingCostIqd === "number"
        ? { shippingCostIqd: data.shippingCostIqd }
        : {}),
      ...(typeof data.customsCostIqd === "number"
        ? { customsCostIqd: data.customsCostIqd }
        : {}),
      ...(typeof data.brokerageCostIqd === "number"
        ? { brokerageCostIqd: data.brokerageCostIqd }
        : {}),
      ...(typeof data.handlingCostIqd === "number"
        ? { handlingCostIqd: data.handlingCostIqd }
        : {}),
      ...(typeof data.otherCostIqd === "number"
        ? { otherCostIqd: data.otherCostIqd }
        : {}),
      ...(typeof data.minMarginPct === "number"
        ? { minMarginPct: data.minMarginPct }
        : {}),
    },
  });

  // Recompute landed cost when any cost field changed
  const costTouched =
    data.costCurrency !== undefined ||
    data.costExchangeRate !== undefined ||
    data.purchasePrice !== undefined ||
    data.shippingCostIqd !== undefined ||
    data.customsCostIqd !== undefined ||
    data.brokerageCostIqd !== undefined ||
    data.handlingCostIqd !== undefined ||
    data.otherCostIqd !== undefined;

  let finalRow = row;
  if (costTouched) {
    const landed = computeLandedCostIqd({
      costCurrency: row.costCurrency,
      costExchangeRate: row.costExchangeRate,
      purchasePrice: row.purchasePrice,
      shippingCostIqd: row.shippingCostIqd,
      customsCostIqd: row.customsCostIqd,
      brokerageCostIqd: row.brokerageCostIqd,
      handlingCostIqd: row.handlingCostIqd,
      otherCostIqd: row.otherCostIqd,
      price: row.price,
      discountPercent: row.discountPercent,
    });
    finalRow = await prisma.product.update({
      where: { id },
      data: { landedCostIqd: landed },
    });
    await writeAuditLog({
      action: "product.cost.update",
      entityType: "Product",
      entityId: id,
      before: {
        landedCostIqd: existing.landedCostIqd,
        purchasePrice: existing.purchasePrice,
      },
      after: {
        landedCostIqd: landed,
        purchasePrice: finalRow.purchasePrice,
      },
    });
  }

  revalidateStorefront({ slug: finalRow.slug, oldSlug: existing.slug });
  return toAdminProduct(finalRow);
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.product.delete({ where: { id } });
  revalidateStorefront({ slug: existing.slug });
  return true;
}
