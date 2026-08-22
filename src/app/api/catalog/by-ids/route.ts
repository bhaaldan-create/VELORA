import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveProductsByIdsOrSlugs } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("ids") || "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);

  if (!ids.length) {
    return NextResponse.json({ ok: true, products: [] });
  }

  const products = await resolveProductsByIdsOrSlugs(ids);
  const stockRows = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.id) } },
    select: { id: true, stock: true },
  });
  const stockById = new Map(stockRows.map((s) => [s.id, s.stock]));

  return NextResponse.json({
    ok: true,
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
}
