import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { getStoredOrder } from "@/lib/orders";
import {
  isMyVeloraEligibleOrder,
  orderBelongsToCustomer,
} from "@/lib/my-velora/eligibility";
import {
  ensureVeloraCardForOrder,
  parseCardPayload,
} from "@/lib/my-velora/generate";
import { renderMyVeloraCardPng } from "@/lib/my-velora/render-card";
import { recordCardEvent } from "@/lib/my-velora/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ orderId: string }> };

/**
 * Server-rendered MY VELORA Story card — exact 1080×1920 PNG.
 * GET /api/auth/my-velora/[orderId]/image
 */
export async function GET(req: Request, ctx: RouteCtx) {
  const { orderId } = await ctx.params;
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, email: true },
    });
    if (!customer) {
      return new Response("Not found", { status: 404 });
    }

    const entry = await getStoredOrder(orderId);
    if (!entry || !isMyVeloraEligibleOrder(entry)) {
      return new Response("Not eligible", { status: 404 });
    }

    const email = customer.email.trim().toLowerCase();
    if (!orderBelongsToCustomer(entry, customer.id, email)) {
      return new Response("Forbidden", { status: 403 });
    }

    const cardRef = await ensureVeloraCardForOrder({
      entry,
      customerId: customer.id,
    });
    if (!cardRef) {
      return new Response("Card error", { status: 500 });
    }

    const row = await prisma.veloraCard.findUnique({
      where: { id: cardRef.id },
      select: { payloadJson: true, id: true },
    });
    if (!row) {
      return new Response("Not found", { status: 404 });
    }

    let payload = parseCardPayload(row.payloadJson);
    if (!payload) {
      return new Response("Invalid payload", { status: 500 });
    }

    // Refresh product/brand assets from live DB so images are never stale/empty.
    const { buildCardPayload } = await import("@/lib/my-velora/generate");
    payload = await buildCardPayload({
      entry,
      customerId: customer.id,
      referralToken: cardRef.referralToken,
    });

    await prisma.veloraCard.update({
      where: { id: row.id },
      data: {
        payloadJson: payload as unknown as import("@/generated/prisma/client").Prisma.InputJsonValue,
      },
    });

    const url = new URL(req.url);
    const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";
    const download = url.searchParams.get("download") === "1";

    const png = await renderMyVeloraCardPng({ payload, locale });

    void recordCardEvent(row.id, download ? "save" : "view", {
      source: "server-image",
    });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.length),
        "Cache-Control": "private, no-store",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="MY-VELORA-${orderId}.png"`,
            }
          : {
              "Content-Disposition": `inline; filename="MY-VELORA-${orderId}.png"`,
            }),
      },
    });
  } catch (error) {
    console.error("[my-velora/image]", error);
    return new Response("Render failed", { status: 500 });
  }
}
