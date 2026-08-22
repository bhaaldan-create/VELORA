import { NextResponse } from "next/server";
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
    })),
  });
}
