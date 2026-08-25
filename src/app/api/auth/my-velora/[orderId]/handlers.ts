import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { getStoredOrder } from "@/lib/orders";
import {
  isMyVeloraEligibleOrder,
  orderBelongsToCustomer,
} from "@/lib/my-velora/eligibility";
import {
  ensureVeloraCardForOrder,
  parseCardPayload,
  recordCardEvent,
  updateCardStyle,
} from "@/lib/my-velora/generate";
import { getVeloraCardConfig } from "@/lib/my-velora/config";
import type { VeloraCardStyleKey } from "@/lib/my-velora/types";

type RouteCtx = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { orderId } = await ctx.params;
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, email: true },
    });
    if (!customer) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const entry = await getStoredOrder(orderId);
    if (!entry || !isMyVeloraEligibleOrder(entry)) {
      return Response.json({ ok: false, error: "Not eligible" }, { status: 404 });
    }

    const email = customer.email.trim().toLowerCase();
    if (!orderBelongsToCustomer(entry, customer.id, email)) {
      return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const cardRef = await ensureVeloraCardForOrder({
      entry,
      customerId: customer.id,
    });
    if (!cardRef) {
      return Response.json({ ok: false, error: "Card error" }, { status: 500 });
    }

    const row = await prisma.veloraCard.findUnique({
      where: { id: cardRef.id },
      include: {
        reviews: { where: { customerId: customer.id }, take: 1 },
      },
    });
    if (!row) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const payload = parseCardPayload(row.payloadJson);
    if (!payload) {
      return Response.json({ ok: false, error: "Invalid payload" }, { status: 500 });
    }

    const config = await getVeloraCardConfig();

    return Response.json({
      ok: true,
      card: {
        id: row.id,
        orderId: row.orderId,
        styleKey: row.styleKey,
        themeKey: row.themeKey,
        payload,
        hasReview: row.reviews.length > 0,
        reviewRewardPoints: config.reviewRewardPoints,
      },
    });
  } catch (error) {
    console.error("[auth/my-velora/orderId GET]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const { orderId } = await ctx.params;
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { styleKey?: VeloraCardStyleKey };
    const card = await prisma.veloraCard.findFirst({
      where: {
        orderId,
        customerId: session.customerId,
        cardType: "order",
      },
      select: { id: true },
    });
    if (!card || !body.styleKey) {
      return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
    }

    await updateCardStyle(card.id, session.customerId, body.styleKey);
    return Response.json({ ok: true, styleKey: body.styleKey });
  } catch (error) {
    console.error("[auth/my-velora/orderId PATCH]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST_EVENTS(req: Request, ctx: RouteCtx) {
  const { orderId } = await ctx.params;
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      eventType?: string;
      meta?: Record<string, unknown>;
    };
    if (!body.eventType) {
      return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
    }

    const card = await prisma.veloraCard.findFirst({
      where: {
        orderId,
        customerId: session.customerId,
        cardType: "order",
      },
      select: { id: true },
    });
    if (!card) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    await recordCardEvent(card.id, body.eventType, body.meta);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[auth/my-velora/events]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST_REVIEW(req: Request, ctx: RouteCtx) {
  const { orderId } = await ctx.params;
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { rating?: number; comment?: string };
    const rating = Math.min(5, Math.max(1, Math.floor(body.rating ?? 0)));
    if (rating < 1) {
      return Response.json({ ok: false, error: "Rating required" }, { status: 400 });
    }

    const card = await prisma.veloraCard.findFirst({
      where: {
        orderId,
        customerId: session.customerId,
        cardType: "order",
      },
      select: { id: true },
    });
    if (!card) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const config = await getVeloraCardConfig();
    const pointsAwarded = config.reviewRewardPoints > 0 ? config.reviewRewardPoints : 0;

    await prisma.veloraOrderReview.upsert({
      where: {
        orderId_customerId: {
          orderId,
          customerId: session.customerId,
        },
      },
      create: {
        orderId,
        customerId: session.customerId,
        cardId: card.id,
        rating,
        comment: (body.comment || "").trim(),
        pointsAwarded,
      },
      update: {
        rating,
        comment: (body.comment || "").trim(),
      },
    });

    return Response.json({ ok: true, pointsAwarded });
  } catch (error) {
    console.error("[auth/my-velora/review]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
