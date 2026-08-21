import { z } from "zod";
import {
  countAdminProductStats,
  listAdminProducts,
  updateAdminProduct,
} from "@/lib/admin-products";
import { DISCOUNT_OPTIONS } from "@/lib/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
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

    return Response.json({ ok: true, product });
  } catch (error) {
    console.error("[admin/products] PATCH failed", error);
    return Response.json(
      { ok: false, error: "تعذّر تحديث المنتج." },
      { status: 500 },
    );
  }
}
