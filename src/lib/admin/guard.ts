import { cache } from "react";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  parseAdminSessionToken,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  canAccessModule,
  type AdminModule,
} from "@/lib/admin/rbac";

export type AdminActor = {
  subject: string;
  role: string;
  label: string;
};

/** Resolve current admin actor (root or employee) for RBAC + audit. */
export const getAdminActor = cache(async function getAdminActor(): Promise<AdminActor | null> {
  const jar = await cookies();
  const session = await parseAdminSessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!session?.ok) return null;

  if (session.subject === "root") {
    return { subject: "root", role: "root", label: "أدمن VELORA" };
  }

  const emp = await prisma.employee.findUnique({
    where: { id: session.subject },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (emp?.isActive) {
    return {
      subject: emp.id,
      role: emp.role || session.role || "staff",
      label: emp.name.trim() || "الأدمن",
    };
  }

  // Legacy session with role but missing/inactive employee row
  if (session.role) {
    return {
      subject: session.subject,
      role: session.role,
      label: "الأدمن",
    };
  }

  return null;
});

export async function assertAdminModule(
  module: AdminModule,
): Promise<
  | { ok: true; actor: AdminActor }
  | { ok: false; response: Response }
> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "يجب تسجيل الدخول للوحة الإدارة." },
        { status: 401 },
      ),
    };
  }
  if (!canAccessModule(actor.subject, actor.role, module)) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "ليس لديك صلاحية لهذا القسم." },
        { status: 403 },
      ),
    };
  }
  return { ok: true, actor };
}
