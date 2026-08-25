import { prisma } from "@/lib/db";

export type MyVeloraAnalytics = {
  cardsGenerated: number;
  cardsViewed: number;
  cardsSaved: number;
  cardsShared: number;
  referralClicks: number;
  referralRegistrations: number;
  referralOrders: number;
  pointsDistributed: number;
  shareRate: number;
  templateStats: { styleKey: string; count: number; shared: number }[];
  funnel: { generated: number; viewed: number; saved: number; shared: number; clicks: number };
};

export async function getMyVeloraAnalytics(): Promise<MyVeloraAnalytics> {
  const [cards, events, referralEvents, reviews] = await Promise.all([
    prisma.veloraCard.findMany({
      where: { cardType: "order" },
      select: {
        id: true,
        styleKey: true,
        viewedAt: true,
        savedAt: true,
        sharedAt: true,
        pointsEarned: true,
      },
    }),
    prisma.veloraCardEvent.groupBy({
      by: ["eventType"],
      _count: { _all: true },
    }),
    prisma.veloraReferralEvent.groupBy({
      by: ["eventType"],
      _count: { _all: true },
    }),
    prisma.veloraOrderReview.aggregate({
      _sum: { pointsAwarded: true },
    }),
  ]);

  const eventCounts = Object.fromEntries(
    events.map((e) => [e.eventType, e._count._all]),
  );
  const referralCounts = Object.fromEntries(
    referralEvents.map((e) => [e.eventType, e._count._all]),
  );

  const cardsGenerated = cards.length;
  const cardsViewed = cards.filter((c) => c.viewedAt).length;
  const cardsSaved = cards.filter((c) => c.savedAt).length;
  const cardsShared = cards.filter((c) => c.sharedAt).length;
  const referralClicks = referralCounts.click ?? 0;

  const templateMap = new Map<string, { count: number; shared: number }>();
  for (const c of cards) {
    const cur = templateMap.get(c.styleKey) ?? { count: 0, shared: 0 };
    cur.count += 1;
    if (c.sharedAt) cur.shared += 1;
    templateMap.set(c.styleKey, cur);
  }

  const shareRate =
    cardsGenerated > 0 ? Math.round((cardsShared / cardsGenerated) * 100) : 0;

  const orderPoints = cards.reduce((s, c) => s + c.pointsEarned, 0);
  const reviewPoints = reviews._sum.pointsAwarded ?? 0;

  return {
    cardsGenerated,
    cardsViewed,
    cardsSaved,
    cardsShared,
    referralClicks,
    referralRegistrations: referralCounts.registration ?? 0,
    referralOrders: referralCounts.order ?? 0,
    pointsDistributed: orderPoints + reviewPoints,
    shareRate,
    templateStats: [...templateMap.entries()].map(([styleKey, v]) => ({
      styleKey,
      count: v.count,
      shared: v.shared,
    })),
    funnel: {
      generated: cardsGenerated,
      viewed: cardsViewed,
      saved: cardsSaved,
      shared: cardsShared,
      clicks: referralClicks,
    },
  };
}
