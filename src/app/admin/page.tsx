import { AdminShell } from "@/components/admin/AdminShell";
import { OverviewDashboard } from "@/components/admin/OverviewDashboard";
import { getAdminOverview } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const data = await getAdminOverview();

  return (
    <AdminShell active="overview">
      <OverviewDashboard data={data} />
    </AdminShell>
  );
}
