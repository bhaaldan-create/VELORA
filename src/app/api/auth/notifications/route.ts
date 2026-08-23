import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerSessionId } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

function mapNotification(row: {
  id: string;
  titleAr: string;
  bodyAr: string;
  titleEn: string | null;
  bodyEn: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    titleAr: row.titleAr,
    bodyAr: row.bodyAr,
    titleEn: row.titleEn,
    bodyEn: row.bodyEn,
    href: row.href,
    read: Boolean(row.readAt),
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** صندوق إشعارات الزبونة */
export async function GET() {
  try {
    const auth = await requireCustomerSessionId();
    if (!auth.ok) return auth.response;

    const [rows, unreadCount] = await Promise.all([
      prisma.customerNotification.findMany({
        where: { customerId: auth.customerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.customerNotification.count({
        where: { customerId: auth.customerId, readAt: null },
      }),
    ]);

    return Response.json({
      ok: true,
      unreadCount,
      notifications: rows.map(mapNotification),
    });
  } catch (error) {
    console.error("[auth/notifications GET]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل الإشعارات." },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(64)).max(50).optional(),
  markAll: z.boolean().optional(),
});

/** تعليم إشعارات كمقروءة */
export async function PATCH(req: Request) {
  try {
    const auth = await requireCustomerSessionId();
    if (!auth.ok) return auth.response;

    const body = patchSchema.safeParse(await req.json());
    if (!body.success) {
      return Response.json(
        { ok: false, error: "بيانات غير صحيحة." },
        { status: 400 },
      );
    }

    const now = new Date();
    if (body.data.markAll) {
      await prisma.customerNotification.updateMany({
        where: { customerId: auth.customerId, readAt: null },
        data: { readAt: now },
      });
    } else if (body.data.ids?.length) {
      await prisma.customerNotification.updateMany({
        where: {
          customerId: auth.customerId,
          id: { in: body.data.ids },
          readAt: null,
        },
        data: { readAt: now },
      });
    } else {
      return Response.json(
        { ok: false, error: "حدّدي إشعارات للقراءة." },
        { status: 400 },
      );
    }

    const [rows, unreadCount] = await Promise.all([
      prisma.customerNotification.findMany({
        where: { customerId: auth.customerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.customerNotification.count({
        where: { customerId: auth.customerId, readAt: null },
      }),
    ]);

    return Response.json({
      ok: true,
      unreadCount,
      notifications: rows.map(mapNotification),
    });
  } catch (error) {
    console.error("[auth/notifications PATCH]", error);
    return Response.json(
      { ok: false, error: "تعذّر تحديث الإشعارات." },
      { status: 500 },
    );
  }
}
