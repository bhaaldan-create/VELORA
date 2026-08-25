import { AdminShell } from "@/components/admin/AdminShell";
import { BusinessOverviewDashboard } from "@/components/admin/BusinessOverviewDashboard";
import { getBusinessOverview } from "@/lib/finance/overview";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const data = await getBusinessOverview("last30");

  return (
    <AdminShell active="overview" title="نظرة عامة">
      <BusinessOverviewDashboard initial={data} />
    </AdminShell>
  );
}
