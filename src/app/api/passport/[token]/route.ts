import { prisma } from "@/lib/db";
import { clubTierToPassportLevel } from "@/lib/passport/types";
import { getClubConfig } from "@/lib/club/config";
import { computeMemberState } from "@/lib/club/compute";
import { listStoredOrders } from "@/lib/orders";
import { orderBelongsToCustomer } from "@/lib/my-velora/eligibility";
import { ACHIEVEMENT_DEFS } from "@/lib/my-velora/types";
import { getPassportConfig } from "@/lib/passport/number";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/**
 * Public-safe Passport JSON — never exposes email, phone, address, or orders.
 * GET /api/passport/[token]
 */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const clean = decodeURIComponent(token || "").trim();
    if (!clean || clean.length < 12) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const config = await getPassportConfig();
    if (!config.publicShareEnabled) {
      return Response.json({ ok: false, error: "Sharing disabled" }, { status: 404 });
    }

    const customer = await prisma.customer.findFirst({
      where: { passportToken: clean },
      select: {
        id: true,
        fullName: true,
        passportNumber: true,
        createdAt: true,
        email: true,
      },
    });
    if (!customer?.passportNumber) {
      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const [clubConfig, allOrders, unlocked] = await Promise.all([
      getClubConfig(),
      listStoredOrders(),
      prisma.veloraAchievement.findMany({
        where: { customerId: customer.id },
        select: { achievementKey: true },
      }),
    ]);

    const email = customer.email.trim().toLowerCase();
    const owned = allOrders.filter((o) =>
      orderBelongsToCustomer(o, customer.id, email),
    );
    const member = computeMemberState({
      config: clubConfig,
      customerId: customer.id,
      fullName: customer.fullName,
      orders: owned.map((o) => ({
        orderId: o.orderId,
        savedAt: o.savedAt,
        total: o.order.total ?? o.order.subtotal ?? 0,
        status: o.status,
      })),
    });
    const level = clubTierToPassportLevel(member.tierId);
    const unlockedKeys = new Set(unlocked.map((a) => a.achievementKey));
    const first = customer.fullName.trim().split(/\s+/)[0] || "Member";
    const lastInitial =
      customer.fullName.trim().split(/\s+/).slice(1)[0]?.[0] || "";

    return Response.json({
      ok: true,
      passport: {
        displayName: lastInitial ? `${first} ${lastInitial}.` : first,
        passportNumber: customer.passportNumber,
        memberSinceYear: customer.createdAt.getFullYear(),
        level: {
          nameEn: level.nameEn,
          nameAr: level.nameAr,
          mark: level.mark,
        },
        achievements: ACHIEVEMENT_DEFS.filter((d) => unlockedKeys.has(d.key)).map(
          (d) => ({
            key: d.key,
            nameEn: d.nameEn,
            nameAr: d.nameAr,
          }),
        ),
      },
    });
  } catch (error) {
    console.error("[api/passport/token]", error);
    return Response.json({ ok: false, error: "Error" }, { status: 500 });
  }
}
