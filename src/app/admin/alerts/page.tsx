import { AdminShell } from "@/components/admin/AdminShell";
import { AlertsAdmin } from "@/components/admin/AlertsAdmin";

export default function AdminAlertsPage() {
  return (
    <AdminShell active="alerts" title="التنبيهات">
      <AlertsAdmin />
    </AdminShell>
  );
}
