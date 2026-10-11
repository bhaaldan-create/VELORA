import { assertAdminModule, type AdminActor } from "@/lib/admin/guard";

function roleOf(actor: AdminActor) {
  return actor.role.toLowerCase();
}

export function canEditPromotions(actor: AdminActor) {
  const role = roleOf(actor);
  return role === "root" || role === "manager";
}

export function canManageCommissions(actor: AdminActor) {
  const role = roleOf(actor);
  return role === "root" || role === "manager" || role === "finance";
}

export async function requirePromotions(mode: "read" | "edit" | "finance") {
  const gate = await assertAdminModule("promotions");
  if (!gate.ok) return gate;
  if (mode === "edit" && !canEditPromotions(gate.actor)) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, error: "ليس لديك صلاحية تعديل العروض أو العمولات." },
        { status: 403 },
      ),
    };
  }
  if (mode === "finance" && !canManageCommissions(gate.actor)) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, error: "ليس لديك صلاحية اعتماد العمولات." },
        { status: 403 },
      ),
    };
  }
  return gate;
}
