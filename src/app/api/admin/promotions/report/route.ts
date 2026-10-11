import { prisma } from "@/lib/db";
import { requirePromotions } from "@/lib/discounts/access";
import { displayStatus } from "@/lib/discounts/calc";

/**
 * كل الأرقام من CouponRedemption و Coupon.
 * إجمالي البضاعة = merchandiseBefore (بعد خصم المنتج وقبل الكوبون).
 * صافي المؤهل = إجمالي البضاعة − خصم الكوبون. الشحن ليس دخلاً ولا داخل العمولة.
 * العمولة المدفوعة لا تُحسب من حالة الطلب، بل من commissionStatus = PAID.
 */
export async function GET(req: Request) {
  const gate = await requirePromotions("read");
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const createdAt = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lt: new Date(to) } : {}),
  };
  const where = from || to ? { createdAt } : {};
  const rows = await prisma.couponRedemption.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: {
      influencer: { select: { id: true, name: true } },
      coupon: { select: { code: true, campaignId: true } },
    },
  });
  const live = rows.filter((row) => !row.reversed);
  const sum = (list: typeof rows, pick: (row: (typeof rows)[number]) => number) =>
    list.reduce((total, row) => total + pick(row), 0);

  const byCode = new Map<string, number>();
  for (const row of live) {
    byCode.set(row.code, (byCode.get(row.code) || 0) + 1);
  }
  const byInfluencer = new Map<string, { name: string; orders: number; net: number; commission: number }>();
  for (const row of live) {
    if (!row.influencerId) continue;
    const current = byInfluencer.get(row.influencerId) || {
      name: row.influencer?.name || "مؤثر",
      orders: 0,
      net: 0,
      commission: 0,
    };
    current.orders += 1;
    current.net += row.merchandiseBeforeIqd - row.discountIqd;
    current.commission += row.commissionIqd;
    byInfluencer.set(row.influencerId, current);
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const coupons = await prisma.coupon.findMany({
    where: { status: { in: ["ACTIVE", "PAUSED", "DRAFT"] } },
    include: { campaign: { select: { status: true } } },
    take: 300,
  });
  const counts = await prisma.couponRedemption.groupBy({
    by: ["couponId"],
    where: { reversed: false },
    _count: { _all: true },
  });
  const used = new Map(counts.map((row) => [row.couponId, row._count._all]));
  const expiring = coupons.filter(
    (coupon) => coupon.endsAt && coupon.endsAt >= now && coupon.endsAt <= soon,
  );
  const exhausted = coupons.filter((coupon) => {
    return (
      displayStatus({
        status: coupon.status,
        startsAt: coupon.startsAt,
        endsAt: coupon.endsAt,
        now,
        used: used.get(coupon.id) || 0,
        maxRedemptions: coupon.maxRedemptions,
        campaignStatus: coupon.campaign?.status,
        ignoreCampaignPause: coupon.ignoreCampaignPause,
      }) === "EXHAUSTED"
    );
  });

  const attempts = await prisma.couponAttempt.count({
    where: {
      outcome: { not: "ok" },
      ...(from || to ? { createdAt } : { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
    },
  });

  const csv = searchParams.get("format") === "csv";
  if (csv) {
    const header = "orderId,code,discountIqd,netIqd,commissionIqd,commissionStatus,reversed,createdAt";
    const lines = rows.map((row) =>
      [
        row.orderId,
        row.code,
        row.discountIqd,
        row.merchandiseBeforeIqd - row.discountIqd,
        row.commissionIqd,
        row.commissionStatus,
        row.reversed,
        row.createdAt.toISOString(),
      ].join(","),
    );
    return new Response([header, ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=velora-promotions.csv",
      },
    });
  }

  return Response.json({
    ok: true,
    formulas: {
      gross: "مجموع أسعار البيع قبل الكوبون للطلبات غير المعكوسة",
      discount: "مجموع خصم الكوبون، بدون أجور التوصيل",
      net: "إجمالي البضاعة − خصم الكوبون",
      commission: "لقطة العمولة المحفوظة مع الطلب، لا تتغير إذا تغيّر عقد المؤثر لاحقاً",
    },
    totals: {
      redemptions: live.length,
      reversed: rows.length - live.length,
      discountIqd: sum(live, (row) => row.discountIqd),
      grossIqd: sum(live, (row) => row.merchandiseBeforeIqd),
      netIqd: sum(live, (row) => row.merchandiseBeforeIqd - row.discountIqd),
      attributedOrders: live.filter((row) => row.influencerId).length,
      averageOrderIqd: live.length
        ? Math.round(sum(live, (row) => row.merchandiseBeforeIqd - row.discountIqd) / live.length)
        : 0,
      failedAttempts: attempts,
      reviewQueue: live.filter((row) => row.reviewRequired).length,
      commissionPending: sum(
        live.filter((row) => row.commissionStatus === "PENDING" || row.commissionStatus === "HELD"),
        (row) => row.commissionIqd,
      ),
      commissionPaid: sum(
        live.filter((row) => row.commissionStatus === "PAID"),
        (row) => row.commissionIqd,
      ),
      commissionReversed: sum(
        rows.filter((row) => row.commissionStatus === "REVERSED"),
        (row) => row.commissionIqd,
      ),
    },
    topCodes: [...byCode.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([code, count]) => ({ code, count })),
    influencers: [...byInfluencer.values()].sort((a, b) => b.net - a.net).slice(0, 8),
    expiring: expiring.map((coupon) => ({ code: coupon.code, endsAt: coupon.endsAt })),
    exhausted: exhausted.map((coupon) => coupon.code),
    recent: rows.slice(0, 30).map((row) => ({
      id: row.id,
      orderId: row.orderId,
      code: row.code,
      discountIqd: row.discountIqd,
      netIqd: row.merchandiseBeforeIqd - row.discountIqd,
      commissionIqd: row.commissionIqd,
      commissionStatus: row.commissionStatus,
      reviewRequired: row.reviewRequired,
      reversed: row.reversed,
      influencer: row.influencer?.name || null,
      createdAt: row.createdAt,
    })),
  });
}
