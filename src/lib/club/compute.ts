import type {
  ClubActivityItem,
  ClubConfig,
  ClubMemberState,
  ClubTier,
  ClubTierId,
} from "@/lib/club/types";

export type ClubOrderInput = {
  orderId: string;
  savedAt: string;
  total: number;
  status: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatMemberId(customerId: string) {
  const digits = customerId.replace(/\D/g, "");
  const seed = digits.slice(-6) || "000248";
  return `VL-${seed.padStart(6, "0").slice(-6)}`;
}

export function formatReferralCode(fullName: string) {
  const slug = fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toUpperCase()
    .slice(0, 18);
  return `VELORA-${slug || "MEMBER"}`;
}

export function resolveTier(points: number, tiers: ClubTier[]): ClubTier {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0]!;
  for (const tier of sorted) {
    if (points >= tier.minPoints) current = tier;
  }
  return current;
}

export function nextTier(
  points: number,
  tiers: ClubTier[],
): { tier: ClubTier | null; pointsToNext: number; ratio: number } {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  const current = resolveTier(points, sorted);
  const idx = sorted.findIndex((t) => t.id === current.id);
  const next = sorted[idx + 1] ?? null;
  if (!next) {
    return { tier: null, pointsToNext: 0, ratio: 1 };
  }
  const span = Math.max(1, next.minPoints - current.minPoints);
  const progressed = points - current.minPoints;
  return {
    tier: next,
    pointsToNext: Math.max(0, next.minPoints - points),
    ratio: clamp(progressed / span, 0, 1),
  };
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function computeMemberState(input: {
  config: ClubConfig;
  customerId: string;
  fullName: string;
  orders: ClubOrderInput[];
}): ClubMemberState {
  const { config, customerId, fullName, orders } = input;
  const deliveredOrPaid = orders.filter(
    (o) => !["cancelled", "returned", "failed_delivery"].includes(o.status),
  );

  const subtotal = deliveredOrPaid.reduce(
    (sum, o) => sum + Math.max(0, o.total || 0),
    0,
  );

  let earnMultiplier = 1;
  if (config.triplePointsActive) earnMultiplier = 3;
  else if (config.doublePointsActive) earnMultiplier = 2;

  const fromOrders = Math.floor(
    (subtotal / Math.max(1, config.iqdPerPoint)) * earnMultiplier,
  );

  // Soft demo boosters until real review/referral ledger exists
  const fromReviews =
    Math.min(deliveredOrPaid.length, 3) * config.reviewBonus;
  const referralCount = Math.min(Math.floor(deliveredOrPaid.length / 2), 5);
  const fromReferrals = referralCount * config.referralBonus;

  const points = fromOrders + fromReviews + fromReferrals;

  const tier = resolveTier(points, config.tiers);
  const next = nextTier(points, config.tiers);

  const now = new Date();
  const thisMonth = monthKey(now);
  const earnedThisMonth = deliveredOrPaid
    .filter((o) => monthKey(new Date(o.savedAt)) === thisMonth)
    .reduce((sum, o) => {
      return (
        sum +
        Math.floor(
          (Math.max(0, o.total) / Math.max(1, config.iqdPerPoint)) *
            earnMultiplier,
        )
      );
    }, 0);

  const activity: ClubActivityItem[] = [];
  for (const o of [...deliveredOrPaid].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  ).slice(0, 6)) {
    const delta = Math.floor(
      (Math.max(0, o.total) / Math.max(1, config.iqdPerPoint)) * earnMultiplier,
    );
    if (delta <= 0) continue;
    activity.push({
      id: `order-${o.orderId}`,
      delta,
      labelEn: `Order #${o.orderId}`,
      labelAr: `طلب #${o.orderId}`,
      at: o.savedAt,
    });
  }
  if (fromReviews > 0) {
    activity.push({
      id: "reviews",
      delta: fromReviews,
      labelEn: "Product reviews",
      labelAr: "مراجعات المنتجات",
      at: now.toISOString(),
    });
  }
  if (fromReferrals > 0) {
    activity.push({
      id: "referrals",
      delta: fromReferrals,
      labelEn: "Friend referrals",
      labelAr: "دعوات الأصدقاء",
      at: now.toISOString(),
    });
  }

  const monthsWithOrders = new Set(
    deliveredOrPaid.map((o) => monthKey(new Date(o.savedAt))),
  );
  let streakMonths = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < 12; i++) {
    const key = monthKey(cursor);
    if (monthsWithOrders.has(key) || (i === 0 && points > 0)) {
      streakMonths += 1;
      cursor.setMonth(cursor.getMonth() - 1);
    } else break;
  }
  streakMonths = Math.min(streakMonths || (points > 0 ? 1 : 0), 3);

  const passportUnlocked = config.passportBrands
    .slice(0, Math.min(config.passportBrands.length, Math.max(1, deliveredOrPaid.length)))
    .map((b) => b.id);

  const nextPrivilegeEn =
    next.tier?.nameEn
      ? `${next.tier.nameEn} Beauty Gift`
      : "Privé Beauty Gift";
  const nextPrivilegeAr =
    next.tier?.nameAr
      ? `هدية جمال ${next.tier.nameAr}`
      : "هدية جمال بريفيه";

  return {
    customerId,
    fullName,
    memberId: formatMemberId(customerId),
    referralCode: formatReferralCode(fullName),
    points,
    tierId: tier.id as ClubTierId,
    nextTierId: (next.tier?.id as ClubTierId | undefined) ?? null,
    pointsToNext: next.pointsToNext,
    progressRatio: next.ratio,
    earnedThisMonth,
    fromReviews,
    fromReferrals,
    referralCount,
    streakMonths,
    passportUnlocked,
    activity: activity.slice(0, 8),
    nextPrivilegeEn,
    nextPrivilegeAr,
  };
}
