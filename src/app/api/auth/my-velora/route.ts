import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { listStoredOrders } from "@/lib/orders";
import {
  isMyVeloraEligibleOrder,
  orderBelongsToCustomer,
} from "@/lib/my-velora/eligibility";
import { ensureVeloraCardForOrder } from "@/lib/my-velora/generate";
import {
  getCustomerJourneyStats,
  listCustomerCards,
  syncCustomerAchievements,
} from "@/lib/my-velora/journey";

export async function GET() {
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

    const email = customer.email.trim().toLowerCase();
    const all = await listStoredOrders();
    const eligible = all.filter(
      (o) =>
        isMyVeloraEligibleOrder(o) &&
        orderBelongsToCustomer(o, customer.id, email),
    );

    for (const entry of eligible) {
      await ensureVeloraCardForOrder({
        entry,
        customerId: customer.id,
      });
    }

    const [cards, journey, achievements] = await Promise.all([
      listCustomerCards(customer.id),
      getCustomerJourneyStats(customer.id, email),
      syncCustomerAchievements(customer.id, email).then(async () =>
        prisma.veloraAchievement.findMany({
          where: { customerId: customer.id },
          orderBy: { unlockedAt: "desc" },
          select: { achievementKey: true, unlockedAt: true },
        }),
      ),
    ]);

    return Response.json({
      ok: true,
      cards: cards.map((c) => ({
        ...c,
        generatedAt: c.generatedAt.toISOString(),
        viewedAt: c.viewedAt?.toISOString() ?? null,
        sharedAt: c.sharedAt?.toISOString() ?? null,
      })),
      journey,
      achievements: achievements.map((a) => ({
        achievementKey: a.achievementKey,
        unlockedAt: a.unlockedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[auth/my-velora]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
