import { prisma } from "@/lib/db";
import type {
  AdminProduct,
  AdminProductDetail,
  AdminProductStats,
} from "@/lib/admin-product-types";
import {
  resolveStoredImageForClient,
  isEphemeralClientImageUrl,
  productMediaUrl,
} from "@/lib/admin/media-url";
import { writeAuditLog } from "@/lib/finance/audit";
import { computeLandedCostIqd } from "@/lib/finance/product-cost";
import { salePriceFromBase } from "@/lib/pricing";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import type { CategorySlug, SkinConcern } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

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

/** List queries must NEVER select imageUrl/brandLogoUrl (may be multi-MB data URLs). */
const adminListSelect = {
  id: true,
  slug: true,
  name: true,
  nameAr: true,
  categorySlug: true,
  price: true,
  discountPercent: true,
  stock: true,
  isActive: true,
  isBestseller: true,
  isNew: true,
  size: true,
  brandName: true,
  updatedAt: true,
} as const;

type AdminListRow = Prisma.ProductGetPayload<{ select: typeof adminListSelect }>;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function toAdminProductLight(row: AdminListRow): AdminProduct {
  const discountPercent = row.discountPercent || 0;
  const bust = row.updatedAt.getTime();
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
    // Thumbnail via media proxy — avoids loading blobs into admin list JSON
    imageUrl: productMediaUrl(row.id, "product", bust),
    brandName: row.brandName,
    brandLogoUrl: null,
    updatedAt: row.updatedAt.toISOString(),
  };
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
  const bust = row.updatedAt.getTime();
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
    imageUrl: resolveStoredImageForClient(row.imageUrl, row.id, "product", bust),
    brandName: row.brandName,
    brandLogoUrl: resolveStoredImageForClient(
      row.brandLogoUrl,
      row.id,
      "brandLogo",
      bust,
    ),
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
  skinTypesJson: unknown;
  productType: string | null;
  featureTagsJson: unknown;
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
    skinTypes: asStringArray(row.skinTypesJson),
    productType: row.productType,
    featureTags: asStringArray(row.featureTagsJson),
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

export type AdminProductListParams = {
  q?: string;
  category?: string | null;
  brand?: string | null;
  visibility?: "all" | "active" | "hidden" | "low" | "out" | "sale";
  page?: number;
  pageSize?: number;
};

function buildAdminListWhere(
  params: AdminProductListParams,
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  const category = params.category?.trim();
  if (
    category === "skincare" ||
    category === "makeup" ||
    category === "hair-care" ||
    category === "body-care"
  ) {
    and.push({ categorySlug: category });
  }

  const brand = params.brand?.trim();
  if (brand) {
    and.push({ brandName: { equals: brand, mode: "insensitive" } });
  }

  const visibility = params.visibility || "all";
  if (visibility === "active") and.push({ isActive: true });
  if (visibility === "hidden") and.push({ isActive: false });
  if (visibility === "low") and.push({ stock: { gt: 0, lte: 10 } });
  if (visibility === "out") and.push({ stock: { lte: 0 } });
  if (visibility === "sale") and.push({ discountPercent: { gt: 0 } });

  const q = params.q?.trim();
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

/** Lightweight list — never loads image blobs. Prefer paginated query. */
export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await prisma.product.findMany({
    select: adminListSelect,
    orderBy: [{ categorySlug: "asc" }, { nameAr: "asc" }],
  });
  return rows.map(toAdminProductLight);
}

export async function listAdminProductsPage(
  params: AdminProductListParams = {},
): Promise<{
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  stats: AdminProductStats;
  categoryCounts: Record<string, number>;
}> {
  const pageSize = Math.min(Math.max(params.pageSize ?? 24, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const where = buildAdminListWhere(params);

  const [
    total,
    rows,
    allCount,
    activeCount,
    hiddenCount,
    lowCount,
    outCount,
    saleCount,
    grouped,
  ] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: adminListSelect,
      orderBy: [{ categorySlug: "asc" }, { nameAr: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.count({ where: { discountPercent: { gt: 0 } } }),
    prisma.product.groupBy({
      by: ["categorySlug"],
      _count: { _all: true },
    }),
  ]);

  const categoryCounts: Record<string, number> = {
    all: allCount,
    skincare: 0,
    makeup: 0,
    "hair-care": 0,
    "body-care": 0,
  };
  for (const g of grouped) {
    categoryCounts[g.categorySlug] = g._count._all;
  }

  return {
    products: rows.map(toAdminProductLight),
    total,
    page,
    pageSize,
    stats: {
      all: allCount,
      active: activeCount,
      hidden: hiddenCount,
      lowStock: lowCount,
      outOfStock: outCount,
      onSale: saleCount,
    },
    categoryCounts,
  };
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
  skinTypes?: string[];
  productType?: string | null;
  featureTags?: string[];
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
  skinTypes?: string[];
  productType?: string | null;
  featureTags?: string[];
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
      skinTypesJson: cleanList(data.skinTypes ?? []),
      productType: data.productType?.trim() || null,
      featureTagsJson: cleanList(data.featureTags ?? []),
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
      ...(data.imageUrl !== undefined &&
      !isEphemeralClientImageUrl(String(data.imageUrl || ""))
        ? { imageUrl: data.imageUrl }
        : {}),
      ...(data.brandName !== undefined
        ? {
            brandName:
              typeof data.brandName === "string"
                ? data.brandName.trim() || null
                : null,
          }
        : {}),
      ...(data.brandLogoUrl !== undefined &&
      !isEphemeralClientImageUrl(String(data.brandLogoUrl || ""))
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
      ...(data.skinTypes ? { skinTypesJson: cleanList(data.skinTypes) } : {}),
      ...(data.productType !== undefined
        ? {
            productType:
              typeof data.productType === "string"
                ? data.productType.trim() || null
                : null,
          }
        : {}),
      ...(data.featureTags
        ? { featureTagsJson: cleanList(data.featureTags) }
        : {}),
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
