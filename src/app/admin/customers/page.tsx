import { AdminShell } from "@/components/admin/AdminShell";
import { CustomersAdmin } from "@/components/admin/CustomersAdmin";
import { listAdminCustomers } from "@/lib/admin/customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <AdminShell active="customers" title="العملاء">
      <CustomersAdmin initialCustomers={customers} />
    </AdminShell>
  );
}
