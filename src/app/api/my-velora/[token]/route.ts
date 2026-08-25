import { prisma } from "@/lib/db";
import { parseCardPayload } from "@/lib/my-velora/generate";
import { recordCardEvent } from "@/lib/my-velora/generate";
import type { Prisma } from "@/generated/prisma/client";

type RouteCtx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { token } = await ctx.params;
  try {
    const link = await prisma.veloraReferralLink.findUnique({
      where: { token },
      include: {
        card: true,
      },
    });

    if (!link) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return Response.json({ ok: false, error: "Expired" }, { status: 410 });
    }

    await prisma.veloraReferralEvent.create({
      data: {
        referralLinkId: link.id,
        eventType: "click",
        metaJson: {} as Prisma.InputJsonValue,
      },
    });

    if (link.cardId) {
      await recordCardEvent(link.cardId, "referral_click");
    }

    const payload = link.card ? parseCardPayload(link.card.payloadJson) : null;

    return Response.json({
      ok: true,
      landing: {
        titleEn: "Your friend just shared her VELORA beauty moment ✦",
        titleAr: "صديقتك شاركت للتو لحظة جمال VELORA ✦",
        productCount: payload?.productCount ?? link.card?.productCount ?? 0,
        brandCount: payload?.brandCount ?? link.card?.brandCount ?? 0,
        pointsEarned: payload?.pointsEarned ?? link.card?.pointsEarned ?? 0,
      },
    });
  } catch (error) {
    console.error("[my-velora/token]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
