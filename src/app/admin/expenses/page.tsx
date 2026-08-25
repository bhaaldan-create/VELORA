import { AdminShell } from "@/components/admin/AdminShell";
import { ExpensesAdmin } from "@/components/admin/ExpensesAdmin";

export default function AdminExpensesPage() {
  return (
    <AdminShell active="expenses" title="المصروفات">
      <ExpensesAdmin />
    </AdminShell>
  );
}
