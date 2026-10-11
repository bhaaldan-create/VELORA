import { prisma } from "@/lib/db";
import { requirePromotions } from "@/lib/discounts/access";
import { parseBaghdadDateTime } from "@/lib/discounts/calc";
import { writeAuditLog } from "@/lib/finance/audit";

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];

export async function GET() {
  const gate = await requirePromotions("read");
  if (!gate.ok) return gate.response;
  const campaigns = await prisma.promoCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      coupons: { select: { id: true, code: true, status: true, influencerId: true } },
    },
  });
  const ids = campaigns.map((row) => row.id);
  const grouped = ids.length
    ? await prisma.couponRedemption.groupBy({
        by: ["campaignId"],
        where: { campaignId: { in: ids }, reversed: false },
        _count: { _all: true },
        _sum: { discountIqd: true, shippingDiscountIqd: true, merchandiseBeforeIqd: true },
      })
    : [];
  const byId = new Map(grouped.map((row) => [row.campaignId, row]));
  return Response.json({
    ok: true,
    campaigns: campaigns.map((campaign) => {
      const stats = byId.get(campaign.id);
      const discount =
        (stats?._sum.discountIqd || 0) + (stats?._sum.shippingDiscountIqd || 0);
      return {
        ...campaign,
        redemptions: stats?._count._all || 0,
        discountIqd: discount,
        grossIqd: stats?._sum.merchandiseBeforeIqd || 0,
        budgetRemainingIqd:
          campaign.budgetIqd == null ? null : campaign.budgetIqd - discount,
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
    description?: string;
    status?: string;
    startsAt?: string | null;
    endsAt?: string | null;
    budgetIqd?: number | null;
    ownerLabel?: string;
    pause?: boolean;
  };

  if (body.pause && body.id) {
    const before = await prisma.promoCampaign.findUnique({ where: { id: body.id } });
    if (!before) {
      return Response.json({ ok: false, error: "الحملة غير موجودة." }, { status: 404 });
    }
    const campaign = await prisma.promoCampaign.update({
      where: { id: body.id },
      data: { status: "PAUSED" },
    });
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: gate.actor.label,
      action: "campaign.pause",
      entityType: "PromoCampaign",
      entityId: campaign.id,
      before: { status: before.status },
      after: { status: "PAUSED" },
    });
    return Response.json({ ok: true, campaign });
  }

  const status = body.status || "DRAFT";
  if (!STATUSES.includes(status)) {
    return Response.json({ ok: false, error: "حالة الحملة غير مدعومة." }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ ok: false, error: "اسم الحملة مطلوب." }, { status: 400 });
  }
  const startsAt = parseBaghdadDateTime(body.startsAt);
  const endsAt = parseBaghdadDateTime(body.endsAt);
  if (startsAt && endsAt && endsAt <= startsAt) {
    return Response.json({ ok: false, error: "تاريخ نهاية الحملة يجب أن يكون بعد البداية." }, { status: 400 });
  }

  const data = {
    name: body.name.trim().slice(0, 140),
    description: (body.description || "").slice(0, 1000),
    status,
    startsAt,
    endsAt,
    budgetIqd: body.budgetIqd == null ? null : Math.max(0, Math.round(body.budgetIqd)),
    ownerLabel: (body.ownerLabel || "").slice(0, 120),
  };
  const campaign = body.id
    ? await prisma.promoCampaign.update({ where: { id: body.id }, data })
    : await prisma.promoCampaign.create({ data });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: body.id ? "campaign.update" : "campaign.create",
    entityType: "PromoCampaign",
    entityId: campaign.id,
    after: { name: campaign.name, status: campaign.status },
  });
  return Response.json({ ok: true, campaign });
}
