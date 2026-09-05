import { AdminShell } from "@/components/admin/AdminShell";
import { AdminHomeDashboard } from "@/components/admin/AdminHomeDashboard";
import { getAdminActor } from "@/lib/admin/guard";
import { getAdminProductRanks } from "@/lib/admin/home-ranks";
import { getBusinessOverview } from "@/lib/finance/overview";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [data, actor] = await Promise.all([
    getBusinessOverview("last30"),
    getAdminActor(),
  ]);
  const ranks = await getAdminProductRanks(data.salesByProduct);

  return (
    <AdminShell active="overview" title="الرئيسية">
      <AdminHomeDashboard
        initial={data}
        greetingName={actor?.label || "الأدمن"}
        initialTop={ranks.top}
        initialLeast={ranks.least}
      />
    </AdminShell>
  );
}
