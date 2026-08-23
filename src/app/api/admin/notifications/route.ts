import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const broadcastSchema = z.object({
  titleAr: z.string().trim().min(2).max(120),
  bodyAr: z.string().trim().min(2).max(2000),
  titleEn: z.string().trim().max(120).optional().nullable(),
  bodyEn: z.string().trim().max(2000).optional().nullable(),
  href: z.string().trim().max(500).optional().nullable(),
});

/** سجل تعميمات الإشعارات */
export async function GET() {
  try {
    const campaigns = await prisma.notificationCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { _count: { select: { recipients: true } } },
    });

    return Response.json({
      ok: true,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        titleAr: c.titleAr,
        bodyAr: c.bodyAr,
        titleEn: c.titleEn,
        bodyEn: c.bodyEn,
        href: c.href,
        createdBy: c.createdBy,
        createdAt: c.createdAt.toISOString(),
        recipientCount: c._count.recipients,
      })),
    });
  } catch (error) {
    console.error("[admin/notifications GET]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل سجل الإشعارات." },
      { status: 500 },
    );
  }
}

/** تعميم إشعار لجميع الزبائن المسجّلين */
export async function POST(req: Request) {
  try {
    const parsed = broadcastSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "أدخلي عنواناً ونصاً صالحين للتعميم." },
        { status: 400 },
      );
    }

    const titleAr = parsed.data.titleAr;
    const bodyAr = parsed.data.bodyAr;
    const titleEn = parsed.data.titleEn?.trim() || null;
    const bodyEn = parsed.data.bodyEn?.trim() || null;
    const href = parsed.data.href?.trim() || null;

    const customers = await prisma.customer.findMany({
      select: { id: true },
    });

    const campaign = await prisma.notificationCampaign.create({
      data: {
        titleAr,
        bodyAr,
        titleEn,
        bodyEn,
        href,
        recipients: {
          create: customers.map((c) => ({
            customerId: c.id,
            titleAr,
            bodyAr,
            titleEn,
            bodyEn,
            href,
          })),
        },
      },
      include: { _count: { select: { recipients: true } } },
    });

    return Response.json({
      ok: true,
      campaign: {
        id: campaign.id,
        titleAr: campaign.titleAr,
        bodyAr: campaign.bodyAr,
        titleEn: campaign.titleEn,
        bodyEn: campaign.bodyEn,
        href: campaign.href,
        createdAt: campaign.createdAt.toISOString(),
        recipientCount: campaign._count.recipients,
      },
    });
  } catch (error) {
    console.error("[admin/notifications POST]", error);
    return Response.json(
      { ok: false, error: "تعذّر إرسال التعميم." },
      { status: 500 },
    );
  }
}
