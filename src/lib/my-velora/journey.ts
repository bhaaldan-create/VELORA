import { prisma } from "@/lib/db";
import { getClubConfig } from "@/lib/club/config";
import { computeMemberState } from "@/lib/club/compute";
import { listStoredOrders } from "@/lib/orders";
import {
  isMyVeloraEligibleOrder,
  orderBelongsToCustomer,
} from "@/lib/my-velora/eligibility";
import type { VeloraJourneyStats } from "@/lib/my-velora/types";
import { ACHIEVEMENT_DEFS } from "@/lib/my-velora/types";
import { buildCardBrands, buildCardProducts } from "@/lib/my-velora/theme";
import { fetchProductRows } from "@/lib/my-velora/generate";

export async function getCustomerJourneyStats(
  customerId: string,
  email: string,
): Promise<VeloraJourneyStats> {
  const all = await listStoredOrders();
  const eligible = all.filter(
    (o) =>
      isMyVeloraEligibleOrder(o) &&
      orderBelongsToCustomer(o, customerId, email),
  );

  const productIds = [
    ...new Set(eligible.flatMap((o) => o.order.items.map((i) => i.id))),
  ];
  const rows = await fetchProductRows(productIds);
  const allProducts = eligible.flatMap((o) =>
    buildCardProducts(o.order, rows),
  );
  const brands = buildCardBrands(allProducts);

  const clubConfig = await getClubConfig();
  const club = computeMemberState({
    config: clubConfig,
    customerId,
    fullName: "",
    orders: eligible.map((o) => ({
      orderId: o.orderId,
      savedAt: o.savedAt,
      total: o.order.total ?? o.order.subtotal,
      status: o.status,
    })),
  });

  return {
    totalOrders: eligible.length,
    totalProducts: allProducts.reduce((n, p) => n + p.quantity, 0),
    brandsTried: brands.length,
    totalPoints: club.points,
    hasEligibleOrders: eligible.length > 0,
  };
}

export async function syncCustomerAchievements(
  customerId: string,
  email: string,
) {
  const stats = await getCustomerJourneyStats(customerId, email);
  const existing = await prisma.veloraAchievement.findMany({
    where: { customerId },
    select: { achievementKey: true },
  });
  const have = new Set(existing.map((a) => a.achievementKey));
  const toCreate: string[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (have.has(def.key)) continue;
    const t = def.threshold as { orders?: number; brands?: number };
    if (t.orders && stats.totalOrders >= t.orders) toCreate.push(def.key);
    if (t.brands && stats.brandsTried >= t.brands) toCreate.push(def.key);
  }

  if (!toCreate.length) return [];

  await prisma.veloraAchievement.createMany({
    data: toCreate.map((achievementKey) => ({ customerId, achievementKey })),
    skipDuplicates: true,
  });

  return toCreate;
}

export async function listCustomerCards(customerId: string) {
  return prisma.veloraCard.findMany({
    where: { customerId, cardType: "order" },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      orderId: true,
      styleKey: true,
      themeKey: true,
      pointsEarned: true,
      productCount: true,
      brandCount: true,
      generatedAt: true,
      viewedAt: true,
      sharedAt: true,
      referralToken: true,
    },
  });
}
