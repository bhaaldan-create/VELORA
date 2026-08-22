import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerSessionId } from "@/lib/customer-session";
import { resolveProductsByIdsOrSlugs } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  productId: z.string().trim().min(1).max(64),
});

/** قائمة أمنيات الزبون المسجّل */
export async function GET() {
  try {
    const auth = await requireCustomerSessionId();
    if (!auth.ok) return auth.response;

    const rows = await prisma.customerWishlistItem.findMany({
      where: { customerId: auth.customerId },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    });

    const ids = rows.map((r) => r.productId);
    const products = ids.length
      ? await resolveProductsByIdsOrSlugs(ids)
      : [];

    const foundIds = new Set(products.map((p) => p.id));
    const orphans = ids.filter((id) => !foundIds.has(id));
    if (orphans.length) {
      await prisma.customerWishlistItem.deleteMany({
        where: {
          customerId: auth.customerId,
          productId: { in: orphans },
        },
      });
    }
    const validIds = ids.filter((id) => foundIds.has(id));

    const stockById = new Map<string, number>();
    if (validIds.length) {
      const stocks = await prisma.product.findMany({
        where: { id: { in: validIds } },
        select: { id: true, stock: true, isActive: true },
      });
      for (const s of stocks) {
        if (s.isActive) stockById.set(s.id, s.stock);
      }
    }

    return Response.json({
      ok: true,
      ids: validIds,
      count: validIds.length,
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        nameAr: p.nameAr,
        price: p.price,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        imageUrl: p.imageUrl,
        imageTone: p.imageTone,
        size: p.size,
        category: p.category,
        stock: stockById.get(p.id) ?? 0,
        inStock: (stockById.get(p.id) ?? 0) > 0,
      })),
    });
  } catch (error) {
    console.error("[auth/wishlist GET]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل المحفوظات." },
      { status: 500 },
    );
  }
}

/** تبديل إضافة/إزالة منتج من قائمة الأمنيات */
export async function POST(req: Request) {
  try {
    const auth = await requireCustomerSessionId();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "معرّف المنتج غير صالح." },
        { status: 400 },
      );
    }

    const productId = parsed.data.productId;
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      return Response.json(
        { ok: false, error: "المنتج غير متوفر." },
        { status: 404 },
      );
    }

    const existing = await prisma.customerWishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId: auth.customerId,
          productId: product.id,
        },
      },
    });

    if (existing) {
      await prisma.customerWishlistItem.delete({ where: { id: existing.id } });
      const count = await prisma.customerWishlistItem.count({
        where: { customerId: auth.customerId },
      });
      return Response.json({
        ok: true,
        wished: false,
        productId: product.id,
        count,
        message: "تمت إزالة المنتج من محفوظاتك.",
      });
    }

    try {
      await prisma.customerWishlistItem.create({
        data: {
          customerId: auth.customerId,
          productId: product.id,
        },
      });
    } catch {
      // منع التكرار عند ضغط مزدوج سريع
    }

    const count = await prisma.customerWishlistItem.count({
      where: { customerId: auth.customerId },
    });
    return Response.json({
      ok: true,
      wished: true,
      productId: product.id,
      count,
      message: "تمت إضافة المنتج إلى محفوظاتك.",
    });
  } catch (error) {
    console.error("[auth/wishlist POST]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحديث المحفوظات." },
      { status: 500 },
    );
  }
}
