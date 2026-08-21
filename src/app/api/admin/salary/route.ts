import { z } from "zod";
import {
  buildPayroll,
  createSalaryItem,
  deleteSalaryItem,
  listSalaryItems,
} from "@/lib/admin-hr";
import { currentMonthKey, isSalaryItemType } from "@/lib/hr-types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthKey = searchParams.get("month") || currentMonthKey();
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return Response.json(
      { ok: false, error: "شهر غير صالح." },
      { status: 400 },
    );
  }
  const [payroll, items] = await Promise.all([
    buildPayroll(monthKey),
    listSalaryItems(monthKey),
  ]);
  return Response.json({ ok: true, monthKey, payroll, items });
}

const createSchema = z.object({
  employeeId: z.string().min(1),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.string().refine((v) => isSalaryItemType(v), {
    message: "نوع غير صالح",
  }),
  amount: z.number().int().positive(),
  reason: z.string().max(300).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الراتب غير صحيحة." },
        { status: 400 },
      );
    }
    const item = await createSalaryItem({
      employeeId: parsed.data.employeeId,
      monthKey: parsed.data.monthKey,
      type: parsed.data.type as "advance" | "bonus" | "deduction",
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      date: parsed.data.date,
    });
    return Response.json({ ok: true, item });
  } catch (error) {
    console.error("[admin/salary] POST failed", error);
    return Response.json(
      { ok: false, error: "تعذّر إضافة بند الراتب." },
      { status: 500 },
    );
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "معرّف البند مطلوب." },
        { status: 400 },
      );
    }
    const ok = await deleteSalaryItem(parsed.data.id);
    if (!ok) {
      return Response.json(
        { ok: false, error: "البند غير موجود." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/salary] DELETE failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حذف بند الراتب." },
      { status: 500 },
    );
  }
}
