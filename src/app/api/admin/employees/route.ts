import { z } from "zod";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "@/lib/admin-hr";
import { EMPLOYEE_ROLES, isEmployeeRole } from "@/lib/hr-types";

export async function GET() {
  const employees = await listEmployees();
  return Response.json({ ok: true, employees });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
  role: z
    .string()
    .refine((v) => isEmployeeRole(v), { message: "دور غير صالح" })
    .optional(),
  baseSalary: z.number().int().nonnegative().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
  branchId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الموظف غير صحيحة. اختاري الفرع." },
        { status: 400 },
      );
    }
    const employee = await createEmployee({
      ...parsed.data,
      role: parsed.data.role as (typeof EMPLOYEE_ROLES)[number]["id"] | undefined,
    });
    return Response.json({ ok: true, employee });
  } catch (error) {
    console.error("[admin/employees] POST failed", error);
    const message =
      error instanceof Error && error.message.includes("الفرع")
        ? error.message
        : "تعذّر إضافة الموظف.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  role: z
    .string()
    .refine((v) => isEmployeeRole(v), { message: "دور غير صالح" })
    .optional(),
  baseSalary: z.number().int().nonnegative().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional(),
  branchId: z.string().min(1).optional(),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات التحديث غير صحيحة." },
        { status: 400 },
      );
    }
    const { id, ...data } = parsed.data;
    if (Object.keys(data).length === 0) {
      return Response.json(
        { ok: false, error: "لا يوجد حقل للتحديث." },
        { status: 400 },
      );
    }
    const employee = await updateEmployee(id, {
      ...data,
      role: data.role as (typeof EMPLOYEE_ROLES)[number]["id"] | undefined,
    });
    if (!employee) {
      return Response.json(
        { ok: false, error: "الموظف غير موجود." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, employee });
  } catch (error) {
    console.error("[admin/employees] PATCH failed", error);
    const message =
      error instanceof Error && error.message.includes("الفرع")
        ? error.message
        : "تعذّر تحديث الموظف.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "معرّف الموظف مطلوب." },
        { status: 400 },
      );
    }
    const ok = await deleteEmployee(parsed.data.id);
    if (!ok) {
      return Response.json(
        { ok: false, error: "الموظف غير موجود." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/employees] DELETE failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حذف الموظف." },
      { status: 500 },
    );
  }
}
