import { prisma } from "@/lib/db";
import { requirePromotions } from "@/lib/discounts/access";
import {
  displayStatus,
  generateCouponCode,
  loadPricedLines,
  normalizeCouponCode,
  quoteDiscount,
  validateCouponWrite,
  createCoupon,
  updateCoupon,
  setCouponStatus,
  type CouponWrite,
} from "@/lib/discounts/service";
import { DELIVERY_FEE_IQD } from "@/lib/shipping";
import { writeAuditLog } from "@/lib/finance/audit";

function actorLabel(actor: { subject: string; label: string }) {
  return actor.label || actor.subject;
}

async function usageMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, number>();
  const rows = await prisma.couponRedemption.groupBy({
    by: ["couponId"],
    where: { couponId: { in: ids }, reversed: false },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.couponId, row._count._all]));
}

export async function GET(req: Request) {
  const gate = await requirePromotions("read");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const id = searchParams.get("id");
  const now = new Date();

  if (code || id) {
    const coupon = await prisma.coupon.findFirst({
      where: code ? { code: normalizeCouponCode(code) } : { id: id || "" },
      include: {
        campaign: true,
        influencer: true,
        redemptions: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!coupon) {
      return Response.json({ ok: false, error: "الكوبون غير موجود." }, { status: 404 });
    }
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, reversed: false },
    });
    return Response.json({
      ok: true,
      coupon: {
        ...coupon,
        used,
        displayStatus: displayStatus({
          status: coupon.status,
          startsAt: coupon.startsAt,
          endsAt: coupon.endsAt,
          now,
          used,
          maxRedemptions: coupon.maxRedemptions,
          campaignStatus: coupon.campaign?.status,
          ignoreCampaignPause: coupon.ignoreCampaignPause,
        }),
        remaining:
          coupon.maxRedemptions == null
            ? null
            : Math.max(0, coupon.maxRedemptions - used),
      },
    });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { campaign: { select: { id: true, name: true, status: true } }, influencer: { select: { id: true, name: true, status: true } } },
  });
  const used = await usageMap(coupons.map((coupon) => coupon.id));
  return Response.json({
    ok: true,
    coupons: coupons.map((coupon) => {
      const count = used.get(coupon.id) || 0;
      return {
        ...coupon,
        used: count,
        displayStatus: displayStatus({
          status: coupon.status,
          startsAt: coupon.startsAt,
          endsAt: coupon.endsAt,
          now,
          used: count,
          maxRedemptions: coupon.maxRedemptions,
          campaignStatus: coupon.campaign?.status,
          ignoreCampaignPause: coupon.ignoreCampaignPause,
        }),
        remaining:
          coupon.maxRedemptions == null ? null : Math.max(0, coupon.maxRedemptions - count),
      };
    }),
  });
}

export async function POST(req: Request) {
  const gate = await requirePromotions("edit");
  if (!gate.ok) return gate.response;
  const actor = actorLabel(gate.actor);
  const body = (await req.json()) as CouponWrite & {
    action?: string;
    id?: string;
    status?: string;
    count?: number;
    prefix?: string;
    csv?: string;
    items?: { id: string; quantity: number }[];
  };

  if (body.action === "generate") {
    return Response.json({ ok: true, code: generateCouponCode(body.prefix || "VELORA") });
  }

  if (body.action === "preview") {
    const parsed = validateCouponWrite(body);
    if (!body.items?.length) {
      return Response.json({ ok: false, error: "أضيفي منتجات للمعاينة.", configErrors: parsed.errors });
    }
    const { lines } = await loadPricedLines(body.items);
    const result = quoteDiscount({
      lines,
      deliveryFee: DELIVERY_FEE_IQD,
      rule: {
        type: parsed.type === "FIXED" || parsed.type === "FREE_SHIPPING" ? parsed.type : "PERCENT",
        value: parsed.value,
        maxDiscountIqd: body.maxDiscountIqd ?? null,
        minSubtotalIqd: Math.max(0, Math.round(body.minSubtotalIqd || 0)),
        applyToSaleItems: body.applyToSaleItems !== false,
        eligibleProductIds: body.eligibleProductIds || [],
        eligibleCategories: body.eligibleCategories || [],
        eligibleBrands: body.eligibleBrands || [],
        excludedProductIds: body.excludedProductIds || [],
        excludedCategories: body.excludedCategories || [],
        excludedBrands: body.excludedBrands || [],
        minMarginPercent: body.minMarginPercent ?? null,
      },
    });
    return Response.json({ ok: true, result, configErrors: parsed.errors });
  }

  if (body.action === "status" && body.id && body.status) {
    const result = await setCouponStatus(body.id, body.status, actor);
    if (!result.ok) {
      return Response.json(result, { status: 400 });
    }
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: actor,
      action: "coupon.status",
      entityType: "Coupon",
      entityId: body.id,
      before: { status: result.before.status },
      after: { status: result.coupon.status },
    });
    return Response.json({ ok: true, coupon: result.coupon });
  }

  if (body.action === "duplicate" && body.id) {
    const source = await prisma.coupon.findUnique({ where: { id: body.id } });
    if (!source) {
      return Response.json({ ok: false, error: "الكوبون غير موجود." }, { status: 404 });
    }
    const created = await createCoupon(
      {
        ...source,
        code: generateCouponCode(source.code.slice(0, 8)),
        name: `${source.name} نسخة`,
        status: "DRAFT",
        eligibleProductIds: source.eligibleProductIds as string[],
        eligibleCategories: source.eligibleCategories as string[],
        eligibleBrands: source.eligibleBrands as string[],
        excludedProductIds: source.excludedProductIds as string[],
        excludedCategories: source.excludedCategories as string[],
        excludedBrands: source.excludedBrands as string[],
        restrictedCustomerIds: source.restrictedCustomerIds as string[],
        startsAt: source.startsAt?.toISOString() || null,
        endsAt: source.endsAt?.toISOString() || null,
      },
      actor,
    );
    if (!created.ok) return Response.json(created, { status: 400 });
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: actor,
      action: "coupon.duplicate",
      entityType: "Coupon",
      entityId: created.coupon.id,
      after: { from: source.id, code: created.coupon.code },
    });
    return Response.json({ ok: true, coupon: created.coupon });
  }

  if (body.action === "bulk" || body.action === "import") {
    if (!body.confirmHighImpact) {
      return Response.json(
        { ok: false, error: "الاستيراد أو التوليد الجماعي يحتاج تأكيداً.", requiresConfirmation: true },
        { status: 409 },
      );
    }
    const codes =
      body.action === "import"
        ? (body.csv || "")
            .split(/\r?\n/)
            .map((line) => line.split(",")[0] || "")
            .map((line) => normalizeCouponCode(line))
            .filter((line) => line && line !== "CODE")
        : Array.from({ length: Math.min(50, Math.max(1, Math.round(body.count || 1))) }, () =>
            generateCouponCode(body.prefix || "VELORA"),
          );
    const unique = [...new Set(codes)];
    const created = [];
    const skipped: string[] = [];
    for (const code of unique) {
      const result = await createCoupon({ ...body, code, status: body.status || "DRAFT" }, actor);
      if (result.ok) created.push(result.coupon.code);
      else skipped.push(`${code}: ${result.error}`);
    }
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: actor,
      action: body.action === "import" ? "coupon.import" : "coupon.bulk",
      entityType: "Coupon",
      after: { created, skipped },
    });
    return Response.json({ ok: true, created, skipped });
  }

  if (body.id) {
    const result = await updateCoupon(body.id, body, actor);
    if (!result.ok) {
      return Response.json(result, { status: result.requiresConfirmation ? 409 : 400 });
    }
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: actor,
      action: "coupon.update",
      entityType: "Coupon",
      entityId: body.id,
      before: { code: result.before.code, value: result.before.value, status: result.before.status },
      after: { code: result.coupon.code, value: result.coupon.value, status: result.coupon.status },
    });
    return Response.json({ ok: true, coupon: result.coupon });
  }

  const result = await createCoupon(
    { ...body, code: body.code || generateCouponCode(body.prefix || "VELORA") },
    actor,
  );
  if (!result.ok) return Response.json(result, { status: 400 });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: actor,
    action: "coupon.create",
    entityType: "Coupon",
    entityId: result.coupon.id,
    after: { code: result.coupon.code, type: result.coupon.type, value: result.coupon.value },
  });
  return Response.json({ ok: true, coupon: result.coupon });
}
