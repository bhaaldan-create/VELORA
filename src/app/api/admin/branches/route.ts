import { z } from "zod";
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
} from "@/lib/admin-hr";

export async function GET() {
  const branches = await listBranches();
  return Response.json({ ok: true, branches });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  city: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الفرع غير صحيحة." },
        { status: 400 },
      );
    }
    const branch = await createBranch(parsed.data);
    return Response.json({ ok: true, branch });
  } catch (error) {
    console.error("[admin/branches] POST failed", error);
    return Response.json(
      { ok: false, error: "تعذّر إضافة الفرع." },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  city: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
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
    const branch = await updateBranch(id, data);
    if (!branch) {
      return Response.json(
        { ok: false, error: "الفرع غير موجود." },
        { status: 404 },
      );
    }
    return Response.json({ ok: true, branch });
  } catch (error) {
    console.error("[admin/branches] PATCH failed", error);
    return Response.json(
      { ok: false, error: "تعذّر تحديث الفرع." },
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
        { ok: false, error: "معرّف الفرع مطلوب." },
        { status: 400 },
      );
    }
    const result = await deleteBranch(parsed.data.id);
    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.error },
        { status: 400 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/branches] DELETE failed", error);
    return Response.json(
      { ok: false, error: "تعذّر حذف الفرع." },
      { status: 500 },
    );
  }
}
