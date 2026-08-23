import { AdminShell } from "@/components/admin/AdminShell";
import { NotificationsAdmin } from "@/components/admin/NotificationsAdmin";

export const dynamic = "force-dynamic";

export default function AdminNotificationsPage() {
  return (
    <AdminShell active="notifications" title="الإشعارات">
      <NotificationsAdmin />
    </AdminShell>
  );
}
