import { AdminShell } from "@/components/admin/AdminShell";
import { BrandsAdmin } from "@/components/admin/BrandsAdmin";

export default function AdminBrandsPage() {
  return (
    <AdminShell active="brands" title="العلامات">
      <BrandsAdmin />
    </AdminShell>
  );
}
