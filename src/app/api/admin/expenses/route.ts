import { z } from "zod";
import { assertAdminModule } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/finance/audit";
import { toIqd } from "@/lib/finance/product-cost";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await assertAdminModule("expenses");
  if (!gate.ok) return gate.response;
  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { category: true },
      take: 200,
    }),
    prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return Response.json({ ok: true, expenses, categories });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive(),
  currency: z.string().default("IQD"),
  exchangeRate: z.number().positive().default(1),
  date: z.string().min(8).max(12),
  recurrence: z.enum(["one_time", "recurring"]).optional(),
  vendor: z.string().optional(),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const gate = await assertAdminModule("expenses");
  if (!gate.ok) return gate.response;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "بيانات المصروف غير صالحة" }, { status: 400 });
  }
  const d = parsed.data;
  const amountIqd = toIqd(d.amount, d.currency, d.exchangeRate);
  const expense = await prisma.expense.create({
    data: {
      name: d.name.trim(),
      categoryId: d.categoryId || null,
      amount: d.amount,
      currency: d.currency,
      exchangeRate: d.exchangeRate,
      amountIqd,
      date: d.date,
      recurrence: d.recurrence || "one_time",
      vendor: d.vendor || "",
      paymentMethod: d.paymentMethod || "",
      description: d.description || "",
      notes: d.notes || "",
    },
  });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: "expense.create",
    entityType: "Expense",
    entityId: expense.id,
    after: expense,
  });
  return Response.json({ ok: true, expense }, { status: 201 });
}

export async function DELETE(req: Request) {
  const gate = await assertAdminModule("expenses");
  if (!gate.ok) return gate.response;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "id مطلوب" }, { status: 400 });
  }
  await prisma.expense.delete({ where: { id } });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: "expense.delete",
    entityType: "Expense",
    entityId: id,
  });
  return Response.json({ ok: true });
}
