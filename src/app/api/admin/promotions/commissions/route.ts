import { prisma } from "@/lib/db";
import { requirePromotions } from "@/lib/discounts/access";
import { writeAuditLog } from "@/lib/finance/audit";

export async function POST(req: Request) {
  const gate = await requirePromotions("finance");
  if (!gate.ok) return gate.response;
  const body = (await req.json()) as {
    redemptionId?: string;
    action?: "approve" | "pay" | "reverse" | "adjust";
    reason?: string;
    reference?: string;
    amount?: number;
    confirmHighImpact?: boolean;
  };
  if (!body.redemptionId || !body.action) {
    return Response.json({ ok: false, error: "الطلب ناقص." }, { status: 400 });
  }
  const before = await prisma.couponRedemption.findUnique({
    where: { id: body.redemptionId },
  });
  if (!before) {
    return Response.json({ ok: false, error: "سجل العمولة غير موجود." }, { status: 404 });
  }

  if (body.action === "approve") {
    if (before.reversed || before.commissionStatus !== "PENDING") {
      return Response.json(
        { ok: false, error: "لا تُعتمد العمولة إلا بعد تسليم الطلب وهي بانتظار الاعتماد." },
        { status: 400 },
      );
    }
    if (before.reviewRequired && !body.confirmHighImpact) {
      return Response.json(
        {
          ok: false,
          error: "هذا السجل عليه إشارة مراجعة. الاعتماد يحتاج تأكيداً.",
          requiresConfirmation: true,
        },
        { status: 409 },
      );
    }
    const row = await prisma.couponRedemption.update({
      where: { id: before.id },
      data: { commissionStatus: "APPROVED" },
    });
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: gate.actor.label,
      action: "commission.approve",
      entityType: "CouponRedemption",
      entityId: row.id,
      before: { commissionStatus: before.commissionStatus },
      after: { commissionStatus: "APPROVED" },
    });
    return Response.json({ ok: true, redemption: row });
  }

  if (body.action === "pay") {
    if (before.commissionStatus !== "APPROVED" || before.reversed) {
      return Response.json(
        { ok: false, error: "الدفع يكون بعد الاعتماد فقط، ولا يُسجَّل تلقائياً عند اكتمال الطلب." },
        { status: 400 },
      );
    }
    if (!body.reference?.trim()) {
      return Response.json({ ok: false, error: "مرجع الدفع مطلوب." }, { status: 400 });
    }
    const row = await prisma.couponRedemption.update({
      where: { id: before.id },
      data: {
        commissionStatus: "PAID",
        payoutReference: body.reference.trim().slice(0, 120),
        paidAt: new Date(),
      },
    });
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: gate.actor.label,
      action: "commission.pay",
      entityType: "CouponRedemption",
      entityId: row.id,
      before: { commissionStatus: before.commissionStatus },
      after: { commissionStatus: "PAID", reference: row.payoutReference },
    });
    return Response.json({ ok: true, redemption: row });
  }

  if (!body.reason?.trim()) {
    return Response.json({ ok: false, error: "سبب التعديل أو العكس مطلوب." }, { status: 400 });
  }

  if (body.action === "reverse") {
    const row = await prisma.couponRedemption.update({
      where: { id: before.id },
      data: {
        reversed: true,
        reversedReason: body.reason.trim().slice(0, 200),
        commissionStatus: before.commissionIqd > 0 ? "REVERSED" : before.commissionStatus,
      },
    });
    await writeAuditLog({
      actorId: gate.actor.subject,
      actorLabel: gate.actor.label,
      action: "commission.reverse",
      entityType: "CouponRedemption",
      entityId: row.id,
      before: { reversed: before.reversed, commissionStatus: before.commissionStatus },
      after: { reversed: true, reason: row.reversedReason },
    });
    return Response.json({ ok: true, redemption: row });
  }

  if (before.commissionStatus === "PAID") {
    return Response.json(
      { ok: false, error: "العمولة مدفوعة. لا يُغيَّر مبلغها بصمت." },
      { status: 400 },
    );
  }
  const amount = Math.max(0, Math.round(Number(body.amount)));
  if (!Number.isFinite(amount)) {
    return Response.json({ ok: false, error: "المبلغ غير صالح." }, { status: 400 });
  }
  const row = await prisma.couponRedemption.update({
    where: { id: before.id },
    data: { commissionIqd: amount },
  });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: "commission.adjust",
    entityType: "CouponRedemption",
    entityId: row.id,
    before: { commissionIqd: before.commissionIqd },
    after: { commissionIqd: amount, reason: body.reason.trim().slice(0, 200) },
  });
  return Response.json({ ok: true, redemption: row });
}
