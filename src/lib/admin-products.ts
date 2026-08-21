import { prisma } from "@/lib/db";
import type { AdminProduct } from "@/lib/admin-product-types";
import { salePriceFromBase } from "@/lib/pricing";

export type { AdminProduct, AdminProductStats } from "@/lib/admin-product-types";
export { countAdminProductStats } from "@/lib/admin-product-types";

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
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await prisma.product.findMany({
    orderBy: [{ categorySlug: "asc" }, { nameAr: "asc" }],
  });
  return rows.map(toAdminProduct);
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
};

export async function updateAdminProduct(
  id: string,
  data: AdminProductUpdate,
): Promise<AdminProduct | null> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

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
    },
  });

  return toAdminProduct(row);
}
