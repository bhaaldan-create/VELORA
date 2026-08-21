"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { formatPrice } from "@/lib/utils";
import {
  ATTENDANCE_STATUSES,
  EMPLOYEE_ROLES,
  PAYROLL_DAYS,
  SALARY_ITEM_TYPES,
  attendanceLabel,
  currentMonthKey,
  roleLabel,
  salaryTypeLabel,
  todayKey,
  type AdminAttendance,
  type AdminBranch,
  type AdminEmployee,
  type AdminSalaryItem,
  type AttendanceStatus,
  type EmployeeRole,
  type HrStats,
  type PayrollRow,
  type SalaryItemType,
} from "@/lib/hr-types";

type Tab = "employees" | "attendance" | "payroll" | "branches";

const fieldClass =
  "mt-1 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]";

type Props = {
  initialEmployees: AdminEmployee[];
  initialBranches: AdminBranch[];
  initialAttendance: AdminAttendance[];
  initialPayroll: PayrollRow[];
  initialSalaryItems: AdminSalaryItem[];
  initialStats: HrStats;
  initialDate: string;
  initialMonth: string;
};

export function EmployeesAdmin({
  initialEmployees,
  initialBranches,
  initialAttendance,
  initialPayroll,
  initialSalaryItems,
  initialStats,
  initialDate,
  initialMonth,
}: Props) {
  const [tab, setTab] = useState<Tab>("employees");
  const [employees, setEmployees] = useState(initialEmployees);
  const [branches, setBranches] = useState(initialBranches);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [payroll, setPayroll] = useState(initialPayroll);
  const [salaryItems, setSalaryItems] = useState(initialSalaryItems);
  const [stats, setStats] = useState(initialStats);
  const [date, setDate] = useState(initialDate);
  const [month, setMonth] = useState(initialMonth);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  const activeBranches = useMemo(
    () => branches.filter((b) => b.isActive),
    [branches],
  );

  const [newEmp, setNewEmp] = useState({
    name: "",
    phone: "",
    role: "cashier" as EmployeeRole,
    baseSalary: "",
    hireDate: todayKey(),
    notes: "",
    branchId: initialBranches.find((b) => b.isActive)?.id || "",
  });

  const [newBranch, setNewBranch] = useState({
    name: "",
    city: "",
    address: "",
  });

  const [salaryForm, setSalaryForm] = useState({
    employeeId: "",
    type: "advance" as SalaryItemType,
    amount: "",
    reason: "",
  });

  const activeEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (!e.isActive) return false;
      if (branchFilter === "all") return true;
      return e.branchId === branchFilter;
    });
  }, [employees, branchFilter]);

  const attendanceMap = useMemo(() => {
    const m = new Map<string, AdminAttendance>();
    for (const a of attendance) m.set(a.employeeId, a);
    return m;
  }, [attendance]);

  const filteredPayroll = useMemo(() => {
    if (branchFilter === "all") return payroll;
    return payroll.filter((r) => r.branchId === branchFilter);
  }, [payroll, branchFilter]);

  async function reloadAttendance(nextDate: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/attendance?date=${encodeURIComponent(nextDate)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        attendance?: AdminAttendance[];
        error?: string;
      };
      if (!res.ok || !json.ok || !json.attendance) {
        throw new Error(json.error || "تعذّر تحميل الحضور.");
      }
      setAttendance(json.attendance);
      setDate(nextDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل الحضور.");
    } finally {
      setPending(false);
    }
  }

  async function reloadPayroll(nextMonth: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/salary?month=${encodeURIComponent(nextMonth)}`,
      );
      const json = (await res.json()) as {
        ok?: boolean;
        payroll?: PayrollRow[];
        items?: AdminSalaryItem[];
        error?: string;
      };
      if (!res.ok || !json.ok || !json.payroll || !json.items) {
        throw new Error(json.error || "تعذّر تحميل الرواتب.");
      }
      startTransition(() => {
        setPayroll(json.payroll!);
        setSalaryItems(json.items!);
        setMonth(nextMonth);
        setStats((s) => ({
          ...s,
          monthPayrollTotal: json.payroll!.reduce(
            (sum, r) => sum + r.netSalary,
            0,
          ),
        }));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل الرواتب.");
    } finally {
      setPending(false);
    }
  }

  async function reloadBranches() {
    const res = await fetch("/api/admin/branches");
    const json = (await res.json()) as {
      ok?: boolean;
      branches?: AdminBranch[];
    };
    if (json.ok && json.branches) {
      setBranches(json.branches);
      setStats((s) => ({
        ...s,
        branches: json.branches!.filter((b) => b.isActive).length,
      }));
    }
  }

  async function addEmployee() {
    if (!newEmp.name.trim()) {
      setError("اسم الموظف مطلوب.");
      return;
    }
    if (!newEmp.branchId) {
      setError("اختاري فرع الدوام.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmp.name.trim(),
          phone: newEmp.phone.trim(),
          role: newEmp.role,
          baseSalary: Number(newEmp.baseSalary) || 0,
          hireDate: newEmp.hireDate,
          notes: newEmp.notes.trim(),
          branchId: newEmp.branchId,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        employee?: AdminEmployee;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.employee) {
        throw new Error(json.error || "تعذّر إضافة الموظف.");
      }
      const next = [...employees, json.employee].sort((a, b) =>
        a.name.localeCompare(b.name, "ar"),
      );
      setEmployees(next);
      setStats((s) => ({
        ...s,
        employees: next.length,
        active: next.filter((e) => e.isActive).length,
        inactive: next.filter((e) => !e.isActive).length,
      }));
      setNewEmp({
        name: "",
        phone: "",
        role: "cashier",
        baseSalary: "",
        hireDate: todayKey(),
        notes: "",
        branchId: newEmp.branchId,
      });
      await reloadBranches();
      await reloadPayroll(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إضافة الموظف.");
    } finally {
      setPending(false);
    }
  }

  async function patchEmployee(id: string, data: Partial<AdminEmployee>) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        employee?: AdminEmployee;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.employee) {
        throw new Error(json.error || "تعذّر تحديث الموظف.");
      }
      const next = employees.map((e) => (e.id === id ? json.employee! : e));
      setEmployees(next);
      setStats((s) => ({
        ...s,
        active: next.filter((e) => e.isActive).length,
        inactive: next.filter((e) => !e.isActive).length,
      }));
      await reloadBranches();
      await reloadPayroll(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحديث الموظف.");
    } finally {
      setPending(false);
    }
  }

  async function removeEmployee(id: string) {
    if (!confirm("حذف الموظف وجميع سجلاته؟")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "تعذّر حذف الموظف.");
      }
      const next = employees.filter((e) => e.id !== id);
      setEmployees(next);
      setAttendance((prev) => prev.filter((a) => a.employeeId !== id));
      setStats((s) => ({
        ...s,
        employees: next.length,
        active: next.filter((e) => e.isActive).length,
        inactive: next.filter((e) => !e.isActive).length,
      }));
      await reloadBranches();
      await reloadPayroll(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حذف الموظف.");
    } finally {
      setPending(false);
    }
  }

  async function setAttendanceStatus(
    employeeId: string,
    status: AttendanceStatus,
  ) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, date, status }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        attendance?: AdminAttendance;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.attendance) {
        throw new Error(json.error || "تعذّر حفظ الحضور.");
      }
      setAttendance((prev) => {
        const rest = prev.filter((a) => a.employeeId !== employeeId);
        return [...rest, json.attendance!];
      });
      void reloadPayroll(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حفظ الحضور.");
    } finally {
      setPending(false);
    }
  }

  async function addSalaryItem() {
    if (!salaryForm.employeeId) {
      setError("اختاري موظفاً.");
      return;
    }
    const amount = Number(salaryForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("المبلغ يجب أن يكون أكبر من صفر.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: salaryForm.employeeId,
          monthKey: month,
          type: salaryForm.type,
          amount,
          reason: salaryForm.reason.trim(),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        item?: AdminSalaryItem;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.item) {
        throw new Error(json.error || "تعذّر إضافة البند.");
      }
      setSalaryForm({
        employeeId: salaryForm.employeeId,
        type: "advance",
        amount: "",
        reason: "",
      });
      await reloadPayroll(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إضافة البند.");
    } finally {
      setPending(false);
    }
  }

  async function removeSalaryItem(id: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/salary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "تعذّر حذف البند.");
      }
      await reloadPayroll(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حذف البند.");
    } finally {
      setPending(false);
    }
  }

  async function addBranch() {
    if (!newBranch.name.trim()) {
      setError("اسم الفرع مطلوب.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranch.name.trim(),
          city: newBranch.city.trim(),
          address: newBranch.address.trim(),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        branch?: AdminBranch;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.branch) {
        throw new Error(json.error || "تعذّر إضافة الفرع.");
      }
      setBranches((prev) =>
        [...prev, json.branch!].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      setStats((s) => ({ ...s, branches: s.branches + 1 }));
      setNewBranch({ name: "", city: "", address: "" });
      if (!newEmp.branchId) {
        setNewEmp((s) => ({ ...s, branchId: json.branch!.id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إضافة الفرع.");
    } finally {
      setPending(false);
    }
  }

  async function patchBranch(
    id: string,
    data: Partial<{ name: string; city: string; address: string; isActive: boolean }>,
  ) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        branch?: AdminBranch;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.branch) {
        throw new Error(json.error || "تعذّر تحديث الفرع.");
      }
      setBranches((prev) =>
        prev.map((b) => (b.id === id ? json.branch! : b)),
      );
      await reloadBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحديث الفرع.");
    } finally {
      setPending(false);
    }
  }

  async function removeBranch(id: string) {
    if (!confirm("حذف هذا الفرع؟")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "تعذّر حذف الفرع.");
      }
      setBranches((prev) => prev.filter((b) => b.id !== id));
      await reloadBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حذف الفرع.");
    } finally {
      setPending(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "employees", label: "الموظفون" },
    { id: "attendance", label: "الحضور" },
    { id: "payroll", label: "الرواتب" },
    { id: "branches", label: "الفروع" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="الموظفون" value={String(stats.employees)} />
        <StatCard label="نشطون" value={String(stats.active)} />
        <StatCard label="الفروع" value={String(stats.branches)} />
        <StatCard
          label="حضور اليوم"
          value={`${stats.todayPresent} / ${stats.active}`}
        />
        <StatCard
          label="صافي رواتب الشهر"
          value={formatPrice(stats.monthPayrollTotal)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`t2 px-4 py-2 transition ${
              tab === t.id
                ? "bg-[var(--plum)] text-[var(--ivory)]"
                : "border border-[var(--plum)]/15 bg-white text-[var(--plum)] hover:border-[var(--plum)]/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      {tab === "branches" ? (
        <section className="space-y-6">
          <div className="border border-[var(--plum)]/12 bg-white p-5">
            <h2 className="font-display t5 text-[var(--plum)]">إضافة فرع</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="اسم الفرع">
                <input
                  value={newBranch.name}
                  onChange={(e) =>
                    setNewBranch((s) => ({ ...s, name: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="مثال: أربيل - المركز"
                />
              </Field>
              <Field label="المدينة">
                <input
                  value={newBranch.city}
                  onChange={(e) =>
                    setNewBranch((s) => ({ ...s, city: e.target.value }))
                  }
                  className={fieldClass}
                />
              </Field>
              <Field label="العنوان / الحي">
                <input
                  value={newBranch.address}
                  onChange={(e) =>
                    setNewBranch((s) => ({ ...s, address: e.target.value }))
                  }
                  className={fieldClass}
                />
              </Field>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void addBranch()}
              className="t2 mt-4 border border-[var(--plum)] bg-[var(--plum)] px-4 py-2 text-[var(--ivory)] disabled:opacity-40"
            >
              إضافة الفرع
            </button>
          </div>

          <ul className="space-y-3">
            {branches.map((b) => (
              <li
                key={b.id}
                className="border border-[var(--plum)]/12 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`t1 px-2 py-1 ${
                          b.isActive
                            ? "bg-[var(--plum)] text-[var(--ivory)]"
                            : "bg-[var(--mist)] text-[var(--muted)]"
                        }`}
                      >
                        {b.isActive ? "نشط" : "موقوف"}
                      </span>
                      <span className="t2 text-[var(--muted)]">
                        {b.employeeCount} موظف
                      </span>
                    </div>
                    <h3 className="font-display t5 mt-2 text-[var(--plum)]">
                      {b.name}
                    </h3>
                    <p className="t3 text-[var(--muted)]">
                      {[b.city, b.address].filter(Boolean).join(" · ") ||
                        "بدون تفاصيل عنوان"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Field label="الاسم">
                    <input
                      defaultValue={b.name}
                      className={fieldClass}
                      id={`br-name-${b.id}`}
                    />
                  </Field>
                  <Field label="المدينة">
                    <input
                      defaultValue={b.city}
                      className={fieldClass}
                      id={`br-city-${b.id}`}
                    />
                  </Field>
                  <Field label="العنوان">
                    <input
                      defaultValue={b.address}
                      className={fieldClass}
                      id={`br-address-${b.id}`}
                    />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="t2 border border-[var(--plum)] bg-[var(--plum)] px-3 py-2 text-[var(--ivory)] disabled:opacity-40"
                    onClick={() =>
                      void patchBranch(b.id, {
                        name: (
                          document.getElementById(
                            `br-name-${b.id}`,
                          ) as HTMLInputElement
                        ).value.trim(),
                        city: (
                          document.getElementById(
                            `br-city-${b.id}`,
                          ) as HTMLInputElement
                        ).value.trim(),
                        address: (
                          document.getElementById(
                            `br-address-${b.id}`,
                          ) as HTMLInputElement
                        ).value.trim(),
                      })
                    }
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="t2 border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 text-[var(--plum)] disabled:opacity-40"
                    onClick={() =>
                      void patchBranch(b.id, { isActive: !b.isActive })
                    }
                  >
                    {b.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="t2 border border-red-200 bg-red-50 px-3 py-2 text-red-800 disabled:opacity-40"
                    onClick={() => void removeBranch(b.id)}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "employees" ? (
        <section className="space-y-6">
          <div className="border border-[var(--plum)]/12 bg-white p-5">
            <h2 className="font-display t5 text-[var(--plum)]">إضافة موظف</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="الاسم">
                <input
                  value={newEmp.name}
                  onChange={(e) =>
                    setNewEmp((s) => ({ ...s, name: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="مثال: سارة أحمد"
                />
              </Field>
              <Field label="فرع الدوام">
                <select
                  value={newEmp.branchId}
                  onChange={(e) =>
                    setNewEmp((s) => ({ ...s, branchId: e.target.value }))
                  }
                  className={fieldClass}
                >
                  <option value="">اختاري الفرع…</option>
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="الهاتف">
                <input
                  value={newEmp.phone}
                  onChange={(e) =>
                    setNewEmp((s) => ({ ...s, phone: e.target.value }))
                  }
                  className={fieldClass}
                  dir="ltr"
                  placeholder="07xxxxxxxxx"
                />
              </Field>
              <Field label="الدور">
                <select
                  value={newEmp.role}
                  onChange={(e) =>
                    setNewEmp((s) => ({
                      ...s,
                      role: e.target.value as EmployeeRole,
                    }))
                  }
                  className={fieldClass}
                >
                  {EMPLOYEE_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="الراتب الأساسي (د.ع / شهر)">
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={newEmp.baseSalary}
                  onChange={(e) =>
                    setNewEmp((s) => ({ ...s, baseSalary: e.target.value }))
                  }
                  className={fieldClass}
                  dir="ltr"
                />
              </Field>
              <Field label="تاريخ التعيين">
                <input
                  type="date"
                  value={newEmp.hireDate}
                  onChange={(e) =>
                    setNewEmp((s) => ({ ...s, hireDate: e.target.value }))
                  }
                  className={fieldClass}
                  dir="ltr"
                />
              </Field>
              <Field label="ملاحظات">
                <input
                  value={newEmp.notes}
                  onChange={(e) =>
                    setNewEmp((s) => ({ ...s, notes: e.target.value }))
                  }
                  className={fieldClass}
                />
              </Field>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void addEmployee()}
              className="t2 mt-4 border border-[var(--plum)] bg-[var(--plum)] px-4 py-2 text-[var(--ivory)] disabled:opacity-40"
            >
              إضافة الموظف
            </button>
          </div>

          {employees.length === 0 ? (
            <Empty text="لا يوجد موظفون بعد — أضيفي أول موظف أعلاه." />
          ) : (
            <ul className="space-y-4">
              {employees.map((e) => (
                <li
                  key={e.id}
                  className="border border-[var(--plum)]/12 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`t1 px-2 py-1 ${
                            e.isActive
                              ? "bg-[var(--plum)] text-[var(--ivory)]"
                              : "bg-[var(--mist)] text-[var(--muted)]"
                          }`}
                        >
                          {e.isActive ? "نشط" : "موقوف"}
                        </span>
                        <span className="t1 bg-[var(--blush)]/40 px-2 py-1 text-[var(--plum)]">
                          {e.branchName}
                        </span>
                        <span className="t2 text-[var(--muted)]">
                          {roleLabel(e.role)}
                        </span>
                      </div>
                      <h3 className="font-display t5 mt-2 text-[var(--plum)]">
                        {e.name}
                      </h3>
                      <p className="t3 text-[var(--muted)]" dir="ltr">
                        {e.phone || "بدون هاتف"} · تعيين {e.hireDate}
                      </p>
                    </div>
                    <p className="t3 font-medium text-[var(--plum)]">
                      {formatPrice(e.baseSalary)}
                      <span className="t2 text-[var(--muted)]"> / شهر</span>
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="الاسم">
                      <input
                        defaultValue={e.name}
                        className={fieldClass}
                        id={`name-${e.id}`}
                      />
                    </Field>
                    <Field label="فرع الدوام">
                      <select
                        defaultValue={e.branchId}
                        className={fieldClass}
                        id={`branch-${e.id}`}
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                            {!b.isActive ? " (موقوف)" : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="الهاتف">
                      <input
                        defaultValue={e.phone}
                        className={fieldClass}
                        dir="ltr"
                        id={`phone-${e.id}`}
                      />
                    </Field>
                    <Field label="الدور">
                      <select
                        defaultValue={e.role}
                        className={fieldClass}
                        id={`role-${e.id}`}
                      >
                        {EMPLOYEE_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="الراتب الأساسي">
                      <input
                        type="number"
                        defaultValue={e.baseSalary}
                        className={fieldClass}
                        dir="ltr"
                        id={`salary-${e.id}`}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      className="t2 border border-[var(--plum)] bg-[var(--plum)] px-3 py-2 text-[var(--ivory)] disabled:opacity-40"
                      onClick={() => {
                        const name = (
                          document.getElementById(
                            `name-${e.id}`,
                          ) as HTMLInputElement
                        ).value.trim();
                        const phone = (
                          document.getElementById(
                            `phone-${e.id}`,
                          ) as HTMLInputElement
                        ).value.trim();
                        const role = (
                          document.getElementById(
                            `role-${e.id}`,
                          ) as HTMLSelectElement
                        ).value as EmployeeRole;
                        const branchId = (
                          document.getElementById(
                            `branch-${e.id}`,
                          ) as HTMLSelectElement
                        ).value;
                        const baseSalary = Number(
                          (
                            document.getElementById(
                              `salary-${e.id}`,
                            ) as HTMLInputElement
                          ).value,
                        );
                        void patchEmployee(e.id, {
                          name,
                          phone,
                          role,
                          branchId,
                          baseSalary,
                        });
                      }}
                    >
                      حفظ التعديلات
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="t2 border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 text-[var(--plum)] disabled:opacity-40"
                      onClick={() =>
                        void patchEmployee(e.id, { isActive: !e.isActive })
                      }
                    >
                      {e.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="t2 border border-red-200 bg-red-50 px-3 py-2 text-red-800 disabled:opacity-40"
                      onClick={() => void removeEmployee(e.id)}
                    >
                      حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "attendance" ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="تاريخ الحضور">
              <input
                type="date"
                value={date}
                onChange={(e) => void reloadAttendance(e.target.value)}
                className={`${fieldClass} max-w-xs`}
                dir="ltr"
              />
            </Field>
            <Field label="تصفية حسب الفرع">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={`${fieldClass} max-w-xs`}
              >
                <option value="all">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {activeEmployees.length === 0 ? (
            <Empty text="لا يوجد موظفون مطابقون — راجعي الفرع أو أضيفي موظفين." />
          ) : (
            <ul className="space-y-3">
              {activeEmployees.map((e) => {
                const row = attendanceMap.get(e.id);
                const status = row?.status;
                return (
                  <li
                    key={e.id}
                    className="border border-[var(--plum)]/12 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display t4 text-[var(--plum)]">
                          {e.name}
                        </p>
                        <p className="t2 text-[var(--muted)]">
                          {e.branchName} · {roleLabel(e.role)}
                          {status
                            ? ` · ${attendanceLabel(status)}`
                            : " · لم يُسجَّل بعد"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ATTENDANCE_STATUSES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              void setAttendanceStatus(e.id, s.id)
                            }
                            className={`t2 px-3 py-1.5 transition disabled:opacity-40 ${
                              status === s.id
                                ? "bg-[var(--plum)] text-[var(--ivory)]"
                                : "border border-[var(--plum)]/15 bg-[var(--mist)] text-[var(--plum)]"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "payroll" ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="شهر الراتب">
              <input
                type="month"
                value={month}
                onChange={(e) => void reloadPayroll(e.target.value)}
                className={`${fieldClass} max-w-xs`}
                dir="ltr"
              />
            </Field>
            <Field label="تصفية حسب الفرع">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={`${fieldClass} max-w-xs`}
              >
                <option value="all">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <p className="t2 text-[var(--muted)]">
              الحساب: راتب أساسي ÷ {PAYROLL_DAYS} − غياب/نصف يوم − سلف وخصومات +
              مكافآت.
            </p>
          </div>

          <div className="border border-[var(--plum)]/12 bg-white p-5">
            <h2 className="font-display t5 text-[var(--plum)]">
              إضافة سلفة / مكافأة / خصم
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="الموظف">
                <select
                  value={salaryForm.employeeId}
                  onChange={(e) =>
                    setSalaryForm((s) => ({
                      ...s,
                      employeeId: e.target.value,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="">اختاري…</option>
                  {employees
                    .filter((e) => e.isActive)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} · {e.branchName}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="النوع">
                <select
                  value={salaryForm.type}
                  onChange={(e) =>
                    setSalaryForm((s) => ({
                      ...s,
                      type: e.target.value as SalaryItemType,
                    }))
                  }
                  className={fieldClass}
                >
                  {SALARY_ITEM_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="المبلغ">
                <input
                  type="number"
                  min={1}
                  value={salaryForm.amount}
                  onChange={(e) =>
                    setSalaryForm((s) => ({ ...s, amount: e.target.value }))
                  }
                  className={fieldClass}
                  dir="ltr"
                />
              </Field>
              <Field label="السبب">
                <input
                  value={salaryForm.reason}
                  onChange={(e) =>
                    setSalaryForm((s) => ({ ...s, reason: e.target.value }))
                  }
                  className={fieldClass}
                />
              </Field>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void addSalaryItem()}
              className="t2 mt-4 border border-[var(--plum)] bg-[var(--plum)] px-4 py-2 text-[var(--ivory)] disabled:opacity-40"
            >
              إضافة البند
            </button>
          </div>

          {filteredPayroll.length === 0 ? (
            <Empty text="لا يوجد موظفون لهذا الفرع/الشهر." />
          ) : (
            <ul className="space-y-3">
              {filteredPayroll.map((r) => (
                <li
                  key={r.employeeId}
                  className="border border-[var(--plum)]/12 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display t4 text-[var(--plum)]">
                        {r.employeeName}
                      </h3>
                      <p className="t2 text-[var(--muted)]">
                        {r.branchName} · {roleLabel(r.role)} · أساسي{" "}
                        {formatPrice(r.baseSalary)}
                      </p>
                      <p className="t2 mt-1 text-[var(--muted)]">
                        حاضر {r.presentDays} · متأخر {r.lateDays} · نصف{" "}
                        {r.halfDays} · إجازة {r.leaveDays} · غياب {r.absentDays}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="t3 font-medium text-[var(--plum)]">
                        صافي {formatPrice(r.netSalary)}
                      </p>
                      {r.attendanceDeduction > 0 ? (
                        <p className="t2 text-[var(--muted)]">
                          خصم حضور −{formatPrice(r.attendanceDeduction)}
                        </p>
                      ) : null}
                      {r.advances > 0 ? (
                        <p className="t2 text-[var(--muted)]">
                          سلف −{formatPrice(r.advances)}
                        </p>
                      ) : null}
                      {r.bonuses > 0 ? (
                        <p className="t2 text-[var(--muted)]">
                          مكافآت +{formatPrice(r.bonuses)}
                        </p>
                      ) : null}
                      {r.deductions > 0 ? (
                        <p className="t2 text-[var(--muted)]">
                          خصومات −{formatPrice(r.deductions)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {salaryItems.length > 0 ? (
            <div>
              <h3 className="font-display t5 text-[var(--plum)]">
                بنود الشهر ({month || currentMonthKey()})
              </h3>
              <ul className="mt-3 space-y-2">
                {salaryItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 border border-[var(--plum)]/10 bg-[var(--mist)] px-4 py-3"
                  >
                    <div>
                      <p className="t3 text-[var(--plum)]">
                        {item.employeeName} · {salaryTypeLabel(item.type)} ·{" "}
                        {formatPrice(item.amount)}
                      </p>
                      <p className="t2 text-[var(--muted)]">
                        {item.date}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void removeSalaryItem(item.id)}
                      className="t2 text-red-800 disabled:opacity-40"
                    >
                      حذف
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--plum)]/15 bg-white px-4 py-4 text-right">
      <div className="t2 text-[var(--muted)]">{label}</div>
      <div className="font-display t5 mt-1 font-medium text-[var(--plum)]">
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="t2 text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="border border-[var(--plum)]/15 bg-[var(--mist)] px-6 py-16 text-center">
      <p className="t4 text-[var(--plum)]">{text}</p>
    </div>
  );
}
