import { z } from "zod";
import { listAttendanceByDate, upsertAttendance } from "@/lib/admin-hr";
import { isAttendanceStatus, todayKey } from "@/lib/hr-types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { ok: false, error: "تاريخ غير صالح." },
      { status: 400 },
    );
  }
  const attendance = await listAttendanceByDate(date);
  return Response.json({ ok: true, date, attendance });
}

const putSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.string().refine((v) => isAttendanceStatus(v), {
    message: "حالة حضور غير صالحة",
  }),
  note: z.string().max(300).optional(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الحضور غير صحيحة." },
        { status: 400 },
      );
    }
    const row = await upsertAttendance({
      employeeId: parsed.data.employeeId,
      date: parsed.data.date,
      status: parsed.data.status as
        | "present"
        | "absent"
        | "late"
        | "leave"
        | "half",
      note: parsed.data.note,
    });
    return Response.json({ ok: true, attendance: row });
  } catch (error) {
    console.error("[admin/attendance] PUT failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ الحضور." },
      { status: 500 },
    );
  }
}
