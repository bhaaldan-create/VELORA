import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  adminAdjustPoints,
  getLoyaltyBalance,
  listLoyaltyActivity,
} from "@/lib/loyalty/award";
import { backfillPurchaseLoyalty } from "@/lib/loyalty/backfill";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

export const dynamic = "force-dynamic";

function token() {
  return randomBytes(16).toString("hex");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const customerId = url.searchParams.get("customerId")?.trim() || "";

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          referralCode: true,
          referredByCustomerId: true,
        },
      });
      if (!customer) {
        return Response.json(
          { ok: false, error: "الزبون غير موجود." },
          { status: 404 },
        );
      }
      const [balance, activity, qrClaims] = await Promise.all([
        getLoyaltyBalance(customerId),
        listLoyaltyActivity(customerId, 80),
        prisma.loyaltyQrClaim.findMany({
          where: { customerId },
          include: {
            campaign: {
              select: { campaignKey: true, titleAr: true, points: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
      ]);
      return Response.json({
        ok: true,
        customer,
        balance,
        activity,
        qrClaims,
        config: LOYALTY_CONFIG,
      });
    }

    const customers = q
      ? await prisma.customer.findMany({
          where: {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { referralCode: { equals: q.toUpperCase(), mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            referralCode: true,
            loyaltyBalance: true,
          },
          take: 30,
          orderBy: { createdAt: "desc" },
        })
      : await prisma.customer.findMany({
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            referralCode: true,
            loyaltyBalance: true,
          },
          take: 40,
          orderBy: { updatedAt: "desc" },
        });

    const campaigns = await prisma.loyaltyQrCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { claims: true } } },
    });

    const promos = await prisma.loyaltyPromoCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return Response.json({
      ok: true,
      customers,
      campaigns,
      promos,
      config: LOYALTY_CONFIG,
    });
  } catch (error) {
    console.error("[admin/loyalty GET]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل الولاء." },
      { status: 500 },
    );
  }
}

const adjustSchema = z.object({
  action: z.literal("adjust"),
  customerId: z.string().min(1),
  points: z.number().int(),
  reason: z.string().trim().min(2).max(500),
  adminId: z.string().trim().min(1).max(120).default("admin"),
});

const qrCreateSchema = z.object({
  action: z.literal("create_qr"),
  campaignKey: z.string().trim().min(2).max(64),
  titleAr: z.string().trim().max(120).optional(),
  titleEn: z.string().trim().max(120).optional(),
  points: z.number().int().min(1).max(50),
  startsAt: z.string(),
  endsAt: z.string(),
  active: z.boolean().optional(),
  maxClaims: z.number().int().positive().nullable().optional(),
  maxClaimsPerCustomer: z.number().int().positive().optional(),
});

const promoSchema = z.object({
  action: z.literal("create_promo"),
  campaignId: z.string().trim().min(2).max(64),
  type: z.literal("purchase_multiplier"),
  multiplier: z.number().min(1).max(5),
  startsAt: z.string(),
  endsAt: z.string(),
  active: z.boolean().optional(),
});

const backfillSchema = z.object({
  action: z.literal("backfill"),
  dryRun: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action as string;

    if (action === "adjust") {
      const parsed = adjustSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: "بيانات التعديل غير صالحة." },
          { status: 400 },
        );
      }
      const result = await adminAdjustPoints(parsed.data);
      if (!result.ok) {
        return Response.json(
          { ok: false, error: "تعذّر التعديل.", reason: result.reason },
          { status: 400 },
        );
      }
      const balance = await getLoyaltyBalance(parsed.data.customerId);
      return Response.json({ ok: true, result, balance });
    }

    if (action === "create_qr") {
      const parsed = qrCreateSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: "بيانات حملة QR غير صالحة." },
          { status: 400 },
        );
      }
      const d = parsed.data;
      const campaign = await prisma.loyaltyQrCampaign.create({
        data: {
          campaignKey: d.campaignKey.toUpperCase(),
          secureToken: token(),
          titleAr: d.titleAr || d.campaignKey,
          titleEn: d.titleEn || d.campaignKey,
          points: d.points,
          startsAt: new Date(d.startsAt),
          endsAt: new Date(d.endsAt),
          active: d.active ?? true,
          maxClaims: d.maxClaims ?? null,
          maxClaimsPerCustomer: d.maxClaimsPerCustomer ?? 1,
        },
      });
      return Response.json({ ok: true, campaign });
    }

    if (action === "create_promo") {
      const parsed = promoSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: "بيانات الحملة الترويجية غير صالحة." },
          { status: 400 },
        );
      }
      const d = parsed.data;
      const promo = await prisma.loyaltyPromoCampaign.create({
        data: {
          campaignId: d.campaignId,
          type: d.type,
          multiplier: d.multiplier,
          startsAt: new Date(d.startsAt),
          endsAt: new Date(d.endsAt),
          active: d.active ?? true,
        },
      });
      return Response.json({ ok: true, promo });
    }

    if (action === "toggle_qr") {
      const id = String(body.id || "");
      const active = Boolean(body.active);
      if (!id) {
        return Response.json({ ok: false, error: "معرّف مطلوب." }, { status: 400 });
      }
      const campaign = await prisma.loyaltyQrCampaign.update({
        where: { id },
        data: { active },
      });
      return Response.json({ ok: true, campaign });
    }

    if (action === "backfill") {
      const parsed = backfillSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ ok: false, error: "طلب غير صالح." }, { status: 400 });
      }
      const result = await backfillPurchaseLoyalty({
        dryRun: parsed.data.dryRun,
        limit: parsed.data.limit,
      });
      return Response.json({ ok: true, result });
    }

    return Response.json({ ok: false, error: "إجراء غير معروف." }, { status: 400 });
  } catch (error) {
    console.error("[admin/loyalty POST]", error);
    return Response.json(
      { ok: false, error: "تعذّر تنفيذ الإجراء." },
      { status: 500 },
    );
  }
}
