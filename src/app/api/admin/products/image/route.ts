import { prisma } from "@/lib/db";
import type { AdminProduct } from "@/lib/admin-product-types";
import {
  ADMIN_IMAGE_MIME,
  MAX_ADMIN_IMAGE_BYTES,
  MAX_ADMIN_IMAGE_ERROR,
} from "@/lib/admin/image-limits";
import { salePriceFromBase } from "@/lib/pricing";

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
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "أرفقي ملف صورة." }, { status: 400 });
    }
    if (!ADMIN_IMAGE_MIME.has(file.type)) {
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
    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const row = await prisma.product.update({
      where: { id },
      data: { imageUrl },
    });

    return Response.json({ ok: true, product: mapRow(row) });
  } catch (error) {
    console.error("[admin/products/image] POST failed", error);
    return Response.json(
      { ok: false, error: "تعذّر رفع صورة المنتج." },
      { status: 500 },
    );
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
