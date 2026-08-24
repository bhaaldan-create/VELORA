import { prisma } from "@/lib/db";
import type { AdminProduct } from "@/lib/admin-product-types";
import {
  MAX_ADMIN_IMAGE_BYTES,
  MAX_ADMIN_IMAGE_ERROR,
} from "@/lib/admin/image-limits";
import {
  isUploadBlob,
  persistAdminImage,
  resolveUploadMime,
} from "@/lib/admin/persist-image";
import { salePriceFromBase } from "@/lib/pricing";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function mapRow(row: {
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

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = String(form.get("id") || "").trim();
    const kind = String(form.get("kind") || "product").trim();
    const file = form.get("file");

    if (!id) {
      return Response.json({ ok: false, error: "معرّف المنتج مطلوب." }, { status: 400 });
    }
    if (!isUploadBlob(file)) {
      return Response.json({ ok: false, error: "أرفقي ملف صورة." }, { status: 400 });
    }

    const mime = resolveUploadMime({
      type: file.type,
      name: "name" in file ? String((file as File).name || "") : "",
    });
    if (!mime) {
      return Response.json(
        { ok: false, error: "الصيغة المسموحة: JPG أو PNG أو WebP." },
        { status: 400 },
      );
    }
    if (file.size > MAX_ADMIN_IMAGE_BYTES) {
      return Response.json(
        { ok: false, error: MAX_ADMIN_IMAGE_ERROR },
        { status: 400 },
      );
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ ok: false, error: "المنتج غير موجود." }, { status: 404 });
    }

    const isBrandLogo = kind === "brandLogo";
    const buffer = Buffer.from(await file.arrayBuffer());
    const persisted = await persistAdminImage({
      buffer,
      mime,
      folder: isBrandLogo ? "brands" : "products",
      basename: isBrandLogo ? `${id}-brand` : id,
    });

    const row = await prisma.product.update({
      where: { id },
      data: isBrandLogo
        ? { brandLogoUrl: persisted.url }
        : { imageUrl: persisted.url },
    });

    revalidateStorefront({ slug: row.slug });
    return Response.json({ ok: true, product: mapRow(row) });
  } catch (error) {
    console.error("[admin/products/image] POST failed", error);
    const detail =
      error instanceof Error ? error.message : "تعذّر رفع الصورة.";
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { id?: string; kind?: string };
    const id = body.id?.trim();
    const kind = body.kind?.trim() || "product";
    if (!id) {
      return Response.json({ ok: false, error: "معرّف المنتج مطلوب." }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ ok: false, error: "المنتج غير موجود." }, { status: 404 });
    }

    const isBrandLogo = kind === "brandLogo";
    const row = await prisma.product.update({
      where: { id },
      data: isBrandLogo ? { brandLogoUrl: null } : { imageUrl: null },
    });

    revalidateStorefront({ slug: row.slug });
    return Response.json({ ok: true, product: mapRow(row) });
  } catch (error) {
    console.error("[admin/products/image] DELETE failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حذف الصورة." },
      { status: 500 },
    );
  }
}
