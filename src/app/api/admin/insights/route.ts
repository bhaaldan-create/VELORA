import { z } from "zod";
import { assertAdminModule } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { generateRuleInsights } from "@/lib/finance/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await assertAdminModule("ai");
  if (!gate.ok) return gate.response;

  const insights = await prisma.aiInsight.findMany({
    where: { dismissedAt: null },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  return Response.json({ ok: true, insights });
}

export async function POST(req: Request) {
  const gate = await assertAdminModule("ai");
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  if (body?.action === "generate") {
    const count = await generateRuleInsights();
    const insights = await prisma.aiInsight.findMany({
      where: { dismissedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ ok: true, generated: count, insights });
  }
  return Response.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
}

const dismissSchema = z.object({
  id: z.string().min(1),
  action: z.literal("dismiss"),
});

export async function PATCH(req: Request) {
  const gate = await assertAdminModule("ai");
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const parsed = dismissSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }
  const insight = await prisma.aiInsight.update({
    where: { id: parsed.data.id },
    data: { dismissedAt: new Date() },
  });
  return Response.json({ ok: true, insight });
}
