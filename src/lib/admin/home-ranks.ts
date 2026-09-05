import { prisma } from "@/lib/db";

export type RankedProductCard = {
  id: string;
  nameAr: string;
  brandName: string;
  imageUrl: string | null;
  slug: string;
  units: number;
  revenue: number;
};

/**
 * Top / least sold products for the admin home, grounded in period sales + catalog.
 * Products with no sales in the period count as 0 units (for least-sold).
 */
export async function getAdminProductRanks(
  salesByProduct: { key: string; name: string; revenue: number; units: number }[],
): Promise<{ top: RankedProductCard[]; least: RankedProductCard[] }> {
  const sales = new Map(
    salesByProduct.map((p) => [p.key, { units: p.units, revenue: p.revenue, name: p.name }]),
  );

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameAr: true,
      brandName: true,
      imageUrl: true,
      slug: true,
    },
    take: 400,
  });

  const ranked: RankedProductCard[] = products.map((p) => {
    const hit = sales.get(p.id);
    return {
      id: p.id,
      nameAr: hit?.name || p.nameAr,
      brandName: p.brandName || "—",
      imageUrl: p.imageUrl,
      slug: p.slug,
      units: hit?.units ?? 0,
      revenue: hit?.revenue ?? 0,
    };
  });

  const byUnitsDesc = [...ranked].sort(
    (a, b) => b.units - a.units || b.revenue - a.revenue,
  );
  const byUnitsAsc = [...ranked].sort(
    (a, b) => a.units - b.units || a.revenue - b.revenue,
  );

  // Prefer products that actually moved for "top"; if none sold yet, show empty top.
  const top =
    byUnitsDesc.some((p) => p.units > 0)
      ? byUnitsDesc.filter((p) => p.units > 0).slice(0, 5)
      : [];

  const least = byUnitsAsc.slice(0, 5);

  return { top, least };
}
