import { AdminShell } from "@/components/admin/AdminShell";
import { EmployeesAdmin } from "@/components/admin/EmployeesAdmin";
import {
  buildPayroll,
  getHrStats,
  listAttendanceByDate,
  listBranches,
  listEmployees,
  listSalaryItems,
} from "@/lib/admin-hr";
import { currentMonthKey, todayKey } from "@/lib/hr-types";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  const date = todayKey();
  const month = currentMonthKey();

  const [employees, branches, attendance, payroll, salaryItems, stats] =
    await Promise.all([
      listEmployees(),
      listBranches(),
      listAttendanceByDate(date),
      buildPayroll(month),
      listSalaryItems(month),
      getHrStats(date, month),
    ]);

  return (
    <AdminShell
      active="employees"
      title="الموظفون"
      subtitle="الفريق، الحضور، الرواتب، والفروع."
    >
      <EmployeesAdmin
        initialEmployees={employees}
        initialBranches={branches}
        initialAttendance={attendance}
        initialPayroll={payroll}
        initialSalaryItems={salaryItems}
        initialStats={stats}
        initialDate={date}
        initialMonth={month}
      />
    </AdminShell>
  );
}
