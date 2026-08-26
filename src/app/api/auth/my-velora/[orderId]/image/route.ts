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
  buildCardPayload,
} from "@/lib/my-velora/generate";
import { renderMyVeloraCardPng } from "@/lib/my-velora/render-card";
import { recordCardEvent } from "@/lib/my-velora/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow enough time for sharp compositing on cold start */
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ orderId: string }> };

/**
 * Server-rendered MY VELORA Story card — exact 1080×1920 PNG.
 * GET /api/auth/my-velora/[orderId]/image
 */
export async function GET(req: Request, ctx: RouteCtx) {
  const { orderId } = await ctx.params;
  const url = new URL(req.url);
  const wantsJson = url.searchParams.get("debug") === "1";

  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return wantsJson
        ? Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
        : new Response("Unauthorized", { status: 401 });
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

    // Fresh compact payload (no huge data: URLs) — do NOT write megabyte JSON back.
    const payload = await buildCardPayload({
      entry,
      customerId: customer.id,
      referralToken: cardRef.referralToken,
    });

    const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";
    const download = url.searchParams.get("download") === "1";

    const png = await renderMyVeloraCardPng({ payload, locale });

    void recordCardEvent(cardRef.id, download ? "save" : "view", {
      source: "server-image",
    }).catch(() => undefined);

    if (wantsJson) {
      return Response.json({
        ok: true,
        bytes: png.length,
        products: payload.productCount,
        brands: payload.brandCount,
        points: payload.pointsEarned,
      });
    }

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=60",
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
    const message = error instanceof Error ? error.message : String(error);
    console.error("[my-velora/image]", orderId, message, error);
    return wantsJson
      ? Response.json({ ok: false, error: message }, { status: 500 })
      : new Response(`Render failed: ${message}`, { status: 500 });
  }
}
