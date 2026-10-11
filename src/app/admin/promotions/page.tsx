import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PromotionsAdmin } from "@/components/admin/PromotionsAdmin";
import { getAdminActor } from "@/lib/admin/guard";
import { canAccessModule } from "@/lib/admin/rbac";
import {
  canEditPromotions,
  canManageCommissions,
} from "@/lib/discounts/access";

export default async function AdminPromotionsPage() {
  const actor = await getAdminActor();
  if (!actor) redirect("/admin/login?next=/admin/promotions");
  if (!canAccessModule(actor.subject, actor.role, "promotions")) {
    redirect("/admin");
  }

  return (
    <AdminShell
      active="promotions"
      title="العروض والأكواد"
      subtitle="الكوبونات، المؤثرون، والحملات. المبلغ النهائي يحسبه الخادم فقط."
    >
      <PromotionsAdmin
        canEdit={canEditPromotions(actor)}
        canFinance={canManageCommissions(actor)}
      />
    </AdminShell>
  );
}
