import { AdminShell } from "@/components/admin/AdminShell";
import { SuppliersAdmin } from "@/components/admin/SuppliersAdmin";

export default function AdminSuppliersPage() {
  return (
    <AdminShell active="suppliers" title="الموردون">
      <SuppliersAdmin />
    </AdminShell>
  );
}
