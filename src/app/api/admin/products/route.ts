import { z } from "zod";
import {
  countAdminProductStats,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductById,
  listAdminProducts,
  updateAdminProduct,
} from "@/lib/admin-products";
import { DISCOUNT_OPTIONS } from "@/lib/pricing";

const categoryEnum = z.enum([
  "skincare",
  "body-care",
  "hair-care",
  "makeup",
]);

const concernEnum = z.enum([
  "hydration",
  "glow",
  "acne",
  "anti-aging",
  "sensitivity",
  "oil-control",
]);

const stringList = z.array(z.string()).transform((arr) =>
  arr.map((s) => s.trim()).filter(Boolean),
);

const stringListRequired = z
  .array(z.string())
  .min(1)
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean))
  .refine((arr) => arr.length >= 1, { message: "قائمة فارغة" });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (id) {
    const product = await getAdminProductById(id);
    if (!product) {
      return Response.json(
        { ok: false, error: "المنتج غير موجود." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, product });
  }

  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const visibility = searchParams.get("visibility") || "all";

  const all = await listAdminProducts();
  const stats = countAdminProductStats(all);

  const products = all.filter((p) => {
    if (visibility === "active" && !p.isActive) return false;
    if (visibility === "hidden" && p.isActive) return false;
    if (visibility === "low" && !(p.stock > 0 && p.stock <= 10)) return false;
    if (visibility === "out" && p.stock > 0) return false;
    if (visibility === "sale" && p.discountPercent <= 0) return false;
    if (!q) return true;
    const hay =
      `${p.id} ${p.slug} ${p.name} ${p.nameAr} ${p.categorySlug}`.toLowerCase();
    return hay.includes(q);
  });

  return Response.json({ ok: true, stats, products });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  categorySlug: categoryEnum,
  price: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  discountPercent: z
    .number()
    .int()
    .refine((v) => (DISCOUNT_OPTIONS as readonly number[]).includes(v), {
      message: "نسبة خصم غير صالحة",
    })
    .optional(),
  size: z.string().min(1).max(40),
  description: z.string().min(1).max(2000),
  descriptionAr: z.string().min(1).max(2000),
  benefits: stringList.default([]),
  benefitsAr: stringListRequired,
  ingredients: stringListRequired,
  concerns: z.array(concernEnum).min(1),
  isActive: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().nonnegative().optional(),
  imageTone: z.string().max(300).optional(),
  slug: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: "بيانات المنتج غير مكتملة أو غير صحيحة.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const product = await createAdminProduct(parsed.data);
    return Response.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    console.error("[admin/products] POST failed", error);
    const message =
      error instanceof Error ? error.message : "تعذّر إضافة المنتج.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  nameAr: z.string().min(1).max(120).optional(),
  price: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  discountPercent: z
    .number()
    .int()
    .refine((v) => (DISCOUNT_OPTIONS as readonly number[]).includes(v), {
      message: "نسبة خصم غير صالحة",
    })
    .optional(),
  isActive: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  categorySlug: categoryEnum.optional(),
  size: z.string().min(1).max(40).optional(),
  description: z.string().min(1).max(2000).optional(),
  descriptionAr: z.string().min(1).max(2000).optional(),
  benefits: stringList.optional(),
  benefitsAr: stringList.optional(),
  ingredients: stringList.optional(),
  concerns: z.array(concernEnum).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().nonnegative().optional(),
  imageTone: z.string().max(300).optional(),
  slug: z.string().max(120).optional(),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات التحديث غير صحيحة." },
        { status: 400 },
      );
    }

    const { id, ...data } = parsed.data;
    if (Object.keys(data).length === 0) {
      return Response.json(
        { ok: false, error: "لا يوجد حقل للتحديث." },
        { status: 400 },
      );
    }

    const product = await updateAdminProduct(id, data);
    if (!product) {
      return Response.json(
        { ok: false, error: "المنتج غير موجود." },
        { status: 404 },
      );
    }

    const detail = await getAdminProductById(id);
    return Response.json({ ok: true, product: detail ?? product });
  } catch (error) {
    console.error("[admin/products] PATCH failed", error);
    const message =
      error instanceof Error ? error.message : "تعذّر تحديث المنتج.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return Response.json(
        { ok: false, error: "معرّف المنتج مطلوب." },
        { status: 400 },
      );
    }
    const ok = await deleteAdminProduct(id);
    if (!ok) {
      return Response.json(
        { ok: false, error: "المنتج غير موجود." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/products] DELETE failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حذف المنتج." },
      { status: 500 },
    );
  }
}
