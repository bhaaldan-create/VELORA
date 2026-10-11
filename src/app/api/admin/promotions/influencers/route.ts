import { prisma } from "@/lib/db";
import { requirePromotions } from "@/lib/discounts/access";
import { createCoupon, type CouponWrite } from "@/lib/discounts/service";
import { writeAuditLog } from "@/lib/finance/audit";

export async function GET() {
  const gate = await requirePromotions("read");
  if (!gate.ok) return gate.response;

  const influencers = await prisma.influencer.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      coupons: { select: { id: true, code: true, status: true, type: true, value: true } },
    },
  });
  const ids = influencers.map((row) => row.id);
  const redemptions = ids.length
    ? await prisma.couponRedemption.findMany({
        where: { influencerId: { in: ids } },
        select: {
          influencerId: true,
          reversed: true,
          discountIqd: true,
          merchandiseBeforeIqd: true,
          commissionIqd: true,
          commissionStatus: true,
          createdAt: true,
        },
      })
    : [];

  return Response.json({
    ok: true,
    influencers: influencers.map((row) => {
      const mine = redemptions.filter((item) => item.influencerId === row.id);
      const live = mine.filter((item) => !item.reversed);
      const sum = (list: typeof live, pick: (item: (typeof live)[number]) => number) =>
        list.reduce((total, item) => total + pick(item), 0);
      return {
        ...row,
        stats: {
          orders: mine.length,
          validOrders: live.length,
          reversedOrders: mine.length - live.length,
          grossIqd: sum(live, (item) => item.merchandiseBeforeIqd),
          discountIqd: sum(live, (item) => item.discountIqd),
          netIqd: sum(live, (item) => item.merchandiseBeforeIqd - item.discountIqd),
          commissionPending: sum(
            live.filter((item) => item.commissionStatus === "PENDING" || item.commissionStatus === "HELD"),
            (item) => item.commissionIqd,
          ),
          commissionApproved: sum(
            live.filter((item) => item.commissionStatus === "APPROVED"),
            (item) => item.commissionIqd,
          ),
          commissionPaid: sum(
            live.filter((item) => item.commissionStatus === "PAID"),
            (item) => item.commissionIqd,
          ),
          commissionReversed: sum(
            mine.filter((item) => item.commissionStatus === "REVERSED"),
            (item) => item.commissionIqd,
          ),
          lastActivity: mine[0]?.createdAt || null,
        },
      };
    }),
  });
}

export async function POST(req: Request) {
  const gate = await requirePromotions("edit");
  if (!gate.ok) return gate.response;
  const body = (await req.json()) as {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    platform?: string;
    username?: string;
    profileUrl?: string;
    notes?: string;
    status?: string;
    agreementStart?: string | null;
    agreementEnd?: string | null;
    commissionEnabled?: boolean;
    commissionType?: string;
    commissionValue?: number;
    coupon?: CouponWrite;
  };

  const status = body.status || "PENDING";
  if (!["PENDING", "ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
    return Response.json({ ok: false, error: "حالة المؤثر غير مدعومة." }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ ok: false, error: "اسم المؤثر مطلوب." }, { status: 400 });
  }
  const commissionType = body.commissionType === "FIXED" ? "FIXED" : "PERCENT";
  const commissionValue = Math.max(0, Math.round(Number(body.commissionValue || 0)));
  if (commissionType === "PERCENT" && commissionValue > 100) {
    return Response.json({ ok: false, error: "نسبة العمولة لا تتجاوز 100." }, { status: 400 });
  }

  const data = {
    name: body.name.trim().slice(0, 120),
    email: (body.email || "").trim().slice(0, 160),
    phone: (body.phone || "").trim().slice(0, 30),
    platform: (body.platform || "").trim().slice(0, 40),
    username: (body.username || "").trim().slice(0, 80),
    profileUrl: (body.profileUrl || "").trim().slice(0, 300),
    notes: (body.notes || "").slice(0, 1000),
    status,
    agreementStart: body.agreementStart ? new Date(body.agreementStart) : null,
    agreementEnd: body.agreementEnd ? new Date(body.agreementEnd) : null,
    commissionEnabled: Boolean(body.commissionEnabled),
    commissionType,
    commissionValue,
  };

  const before = body.id
    ? await prisma.influencer.findUnique({ where: { id: body.id } })
    : null;
  if (body.id && !before) {
    return Response.json({ ok: false, error: "المؤثر غير موجود." }, { status: 404 });
  }
  if (
    before &&
    (before.commissionValue !== commissionValue ||
      before.commissionType !== commissionType ||
      before.commissionEnabled !== data.commissionEnabled)
  ) {
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: gate.actor.label,
      action: "influencer.commission",
      entityType: "Influencer",
      entityId: before.id,
      before: {
        commissionEnabled: before.commissionEnabled,
        commissionType: before.commissionType,
        commissionValue: before.commissionValue,
      },
      after: {
        commissionEnabled: data.commissionEnabled,
        commissionType: data.commissionType,
        commissionValue: data.commissionValue,
      },
    });
  }

  const influencer = before
    ? await prisma.influencer.update({ where: { id: before.id }, data })
    : await prisma.influencer.create({ data });

  let coupon = null;
  if (body.coupon?.code || body.coupon?.type) {
    const created = await createCoupon(
      { ...body.coupon, influencerId: influencer.id, name: body.coupon.name || influencer.name },
      gate.actor.label,
    );
    if (!created.ok) return Response.json(created, { status: 400 });
    coupon = created.coupon;
  }

  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: before ? "influencer.update" : "influencer.create",
    entityType: "Influencer",
    entityId: influencer.id,
    after: { name: influencer.name, status: influencer.status },
  });

  return Response.json({ ok: true, influencer, coupon });
}
