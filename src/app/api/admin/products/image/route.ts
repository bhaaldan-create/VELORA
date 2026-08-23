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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const id = String(form.get("id") || "").trim();
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const persisted = await persistAdminImage({
      buffer,
      mime,
      folder: "products",
      basename: id,
    });

    const row = await prisma.product.update({
      where: { id },
      data: { imageUrl: persisted.url },
    });

    return Response.json({ ok: true, product: mapRow(row) });
  } catch (error) {
    console.error("[admin/products/image] POST failed", error);
    const detail =
      error instanceof Error ? error.message : "تعذّر رفع صورة المنتج.";
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { id?: string };
    const id = body.id?.trim();
    if (!id) {
      return Response.json({ ok: false, error: "معرّف المنتج مطلوب." }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ ok: false, error: "المنتج غير موجود." }, { status: 404 });
    }

    const row = await prisma.product.update({
      where: { id },
      data: { imageUrl: null },
    });

    return Response.json({ ok: true, product: mapRow(row) });
  } catch (error) {
    console.error("[admin/products/image] DELETE failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حذف صورة المنتج." },
      { status: 500 },
    );
  }
}
