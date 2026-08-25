import { AdminShell } from "@/components/admin/AdminShell";
import { ImportsAdmin } from "@/components/admin/ImportsAdmin";

export default function AdminImportsPage() {
  return (
    <AdminShell active="imports" title="الاستيراد">
      <ImportsAdmin />
    </AdminShell>
  );
}
