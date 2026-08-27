import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { getClubConfig } from "@/lib/club/config";
import { computeMemberState } from "@/lib/club/compute";
import { listStoredOrders } from "@/lib/orders";

export async function GET() {
  try {
    const jar = await cookies();
    const session = await verifyCustomerSessionToken(
      jar.get(CUSTOMER_COOKIE)?.value,
    );
    if (!session) {
      return Response.json(
        { ok: false, error: "يجب تسجيل الدخول أولاً." },
        { status: 401 },
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, email: true, fullName: true },
    });
    if (!customer) {
      return Response.json(
        { ok: false, error: "الحساب غير موجود." },
        { status: 404 },
      );
    }

    const config = await getClubConfig();
    const email = customer.email.trim().toLowerCase();
    const all = await listStoredOrders();
    const mine = all.filter((entry) => {
      const byId = entry.order.customerId === customer.id;
      const byEmail =
        (entry.order.email || "").trim().toLowerCase() === email;
      return byId || byEmail;
    });

    const member = computeMemberState({
      config,
      customerId: customer.id,
      fullName: customer.fullName,
      orders: mine.map((entry) => ({
        orderId: entry.orderId,
        savedAt: entry.savedAt,
        total: entry.order.total ?? entry.order.subtotal ?? 0,
        status: entry.status,
      })),
    });

    try {
      const { getLoyaltyBalance } = await import("@/lib/loyalty/award");
      const { resolveTier, nextTier } = await import("@/lib/club/compute");
      const balance = await getLoyaltyBalance(customer.id);
      const points = balance.lifetimeEarned;
      const tier = resolveTier(points, config.tiers);
      const nxt = nextTier(points, config.tiers);
      member.points = points;
      member.tierId = tier.id;
      member.nextTierId = (nxt.tier?.id as typeof member.nextTierId) ?? null;
      member.pointsToNext = nxt.pointsToNext;
      member.progressRatio = nxt.ratio;
    } catch {
      // keep computed fallback
    }

    return Response.json({ ok: true, config, member });
  } catch (error) {
    console.error("[auth/club]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل نادي فيلورا." },
      { status: 500 },
    );
  }
}
