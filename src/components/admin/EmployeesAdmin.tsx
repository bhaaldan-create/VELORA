"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  Building2,
  CalendarCheck,
  UserCog,
  Users,
  Wallet,
} from "@/components/admin/ui/icons";
import { Badge } from "@/components/admin/ui/StatusBadge";
import {
  AdminButton,
  EmptyState,
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
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
  "mt-1.5 h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 text-[13px] text-[var(--admin-text)] outline-none transition focus:border-[var(--admin-plum-soft)]";

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`;
}

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
  const toast = useAdminToast();
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
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [, startTransition] = useTransition();

  // حدّث مؤشر الاتصال كل 30 ثانية
  useEffect(() => {
    if (tab !== "employees") return;
    const id = window.setInterval(() => {
      void fetch("/api/admin/employees")
        .then((r) => r.json())
        .then((json: { ok?: boolean; employees?: AdminEmployee[] }) => {
          if (json.ok && json.employees) setEmployees(json.employees);
        })
        .catch(() => {});
    }, 30_000);
    return () => window.clearInterval(id);
  }, [tab]);

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
    username: "",
    password: "",
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
      const msg = err instanceof Error ? err.message : "تعذّر تحميل الحضور.";
      setError(msg);
      toast.error(msg);
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
      const msg = err instanceof Error ? err.message : "تعذّر تحميل الرواتب.";
      setError(msg);
      toast.error(msg);
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
          ...(newEmp.username.trim()
            ? {
                username: newEmp.username.trim(),
                password: newEmp.password,
              }
            : {}),
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
        username: "",
        password: "",
      });
      setShowAddEmployee(false);
      toast.success("تم إضافة الموظف");
      await reloadBranches();
      await reloadPayroll(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر إضافة الموظف.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  async function patchEmployee(
    id: string,
    data: Partial<AdminEmployee> & {
      password?: string;
      clearLogin?: boolean;
      username?: string | null;
    },
  ) {
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
      toast.success("تم حفظ التعديلات");
      await reloadBranches();
      await reloadPayroll(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر تحديث الموظف.";
      setError(msg);
      toast.error(msg);
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
      toast.success("تم حذف الموظف");
      await reloadBranches();
      await reloadPayroll(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر حذف الموظف.";
      setError(msg);
      toast.error(msg);
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
      toast.success("تم تحديث الحضور", attendanceLabel(status));
      void reloadPayroll(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر حفظ الحضور.";
      setError(msg);
      toast.error(msg);
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
      toast.success("تم إضافة البند");
      await reloadPayroll(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر إضافة البند.";
      setError(msg);
      toast.error(msg);
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
      toast.success("تم حذف البند");
      await reloadPayroll(month);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر حذف البند.";
      setError(msg);
      toast.error(msg);
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
      toast.success("تم إضافة الفرع");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر إضافة الفرع.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  async function patchBranch(
    id: string,
    data: Partial<{
      name: string;
      city: string;
      address: string;
      isActive: boolean;
    }>,
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
      toast.success("تم تحديث الفرع");
      await reloadBranches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر تحديث الفرع.";
      setError(msg);
      toast.error(msg);
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
      toast.success("تم حذف الفرع");
      await reloadBranches();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر حذف الفرع.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  const tabs: {
    id: Tab;
    label: string;
    icon: typeof Users;
  }[] = [
    { id: "employees", label: "الموظفون", icon: Users },
    { id: "attendance", label: "الحضور", icon: CalendarCheck },
    { id: "payroll", label: "الرواتب", icon: Wallet },
    { id: "branches", label: "الفروع", icon: Building2 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="الموظفون"
        description="الفريق، الحضور، الرواتب، وحسابات الدخول — مع مؤشر الاتصال بالموقع."
        actions={
          tab === "employees" ? (
            <AdminButton
              size="sm"
              onClick={() => setShowAddEmployee((v) => !v)}
            >
              {showAddEmployee ? "إغلاق" : "إضافة موظف"}
            </AdminButton>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="الموظفون"
          value={stats.employees}
          format="number"
          icon={Users}
        />
        <StatCard
          label="نشطون"
          value={stats.active}
          format="number"
          icon={UserCog}
          tone="success"
        />
        <StatCard
          label="الفروع"
          value={stats.branches}
          format="number"
          icon={Building2}
        />
        <StatCard
          label="حضور اليوم"
          value={stats.todayPresent}
          format="number"
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard
          label="صافي رواتب الشهر"
          value={stats.monthPayrollTotal}
          format="iqd"
          icon={Wallet}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto admin-scroll pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "bg-[var(--admin-plum)] text-white"
                  : "border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)]"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={1.6} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-[8px] border border-[var(--admin-danger)]/20 bg-[var(--admin-danger-bg)] px-4 py-3 text-[13px] text-[var(--admin-danger)]">
          {error}
        </div>
      ) : null}

      {tab === "branches" ? (
        <section className="space-y-4">
          <Surface>
            <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
              إضافة فرع
            </h2>
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
            <AdminButton
              className="mt-4"
              disabled={pending}
              onClick={() => void addBranch()}
            >
              إضافة الفرع
            </AdminButton>
          </Surface>

          {branches.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="لا توجد فروع"
              description="أضيفي أول فرع لبدء تنظيم الفريق."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {branches.map((b) => (
                <li key={b.id}>
                  <Surface>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-surface-soft)] text-[var(--admin-plum-soft)]">
                          <Building2 className="size-4" strokeWidth={1.6} />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={b.isActive ? "success" : "neutral"}>
                              {b.isActive ? "نشط" : "موقوف"}
                            </Badge>
                            <span className="text-[11px] text-[var(--admin-text-muted)]">
                              {b.employeeCount} موظف
                            </span>
                          </div>
                          <h3 className="mt-1.5 text-[15px] font-semibold text-[var(--admin-text)]">
                            {b.name}
                          </h3>
                          <p className="mt-0.5 text-[12px] text-[var(--admin-text-secondary)]">
                            {[b.city, b.address].filter(Boolean).join(" · ") ||
                              "بدون تفاصيل عنوان"}
                          </p>
                        </div>
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
                      <AdminButton
                        size="sm"
                        disabled={pending}
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
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() =>
                          void patchBranch(b.id, { isActive: !b.isActive })
                        }
                      >
                        {b.isActive ? "إيقاف" : "تفعيل"}
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="danger"
                        disabled={pending}
                        onClick={() => void removeBranch(b.id)}
                      >
                        حذف
                      </AdminButton>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "employees" ? (
        <section className="space-y-4">
          {showAddEmployee ? (
            <Surface className="admin-animate-in">
              <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
                إضافة موظف
              </h2>
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
                <Field label="اسم المستخدم (دخول اللوحة)">
                  <input
                    value={newEmp.username}
                    onChange={(e) =>
                      setNewEmp((s) => ({ ...s, username: e.target.value }))
                    }
                    className={fieldClass}
                    dir="ltr"
                    placeholder="مثال: SaraAhmed"
                    autoComplete="off"
                  />
                </Field>
                <Field label="كلمة المرور">
                  <input
                    type="password"
                    value={newEmp.password}
                    onChange={(e) =>
                      setNewEmp((s) => ({ ...s, password: e.target.value }))
                    }
                    className={fieldClass}
                    dir="ltr"
                    placeholder="٦ أحرف على الأقل"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <AdminButton
                className="mt-4"
                disabled={pending}
                onClick={() => void addEmployee()}
              >
                إضافة الموظف
              </AdminButton>
            </Surface>
          ) : null}

          {employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا يوجد موظفون بعد"
              description="أضيفي أول موظف لبدء الحضور والرواتب."
              action={
                <AdminButton size="sm" onClick={() => setShowAddEmployee(true)}>
                  إضافة موظف
                </AdminButton>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {employees.map((e) => (
                <li key={e.id}>
                  <Surface>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--admin-plum)] text-[12px] font-semibold tracking-wide text-white">
                          {initials(e.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <OnlineDot online={e.isOnline} />
                            <Badge tone={e.isActive ? "success" : "neutral"}>
                              {e.isActive ? "نشط" : "موقوف"}
                            </Badge>
                            <Badge tone="info">{e.branchName}</Badge>
                            <span className="text-[11px] text-[var(--admin-text-muted)]">
                              {roleLabel(e.role)}
                            </span>
                            {e.hasLogin ? (
                              <Badge tone="progress">حساب دخول</Badge>
                            ) : null}
                          </div>
                          <h3 className="mt-1.5 text-[15px] font-semibold text-[var(--admin-text)]">
                            {e.name}
                          </h3>
                          <p
                            className="mt-0.5 text-[12px] text-[var(--admin-text-secondary)]"
                            dir="ltr"
                          >
                            {e.phone || "بدون هاتف"} · تعيين {e.hireDate}
                            {e.username ? ` · @${e.username}` : ""}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--admin-text-muted)]">
                            {e.isOnline
                              ? "نشط على الموقع الآن"
                              : e.lastSeenAt
                                ? `آخر ظهور ${new Date(e.lastSeenAt).toLocaleString("ar-IQ")}`
                                : "غير متصل بالموقع"}
                          </p>
                        </div>
                      </div>
                      <p className="admin-num text-left text-[14px] font-semibold text-[var(--admin-text)]">
                        {formatPrice(e.baseSalary)}
                        <span className="block text-[11px] font-normal text-[var(--admin-text-muted)]">
                          / شهر
                        </span>
                      </p>
                    </div>

                    <details className="mt-3 border-t border-[var(--admin-border)] pt-3">
                      <summary className="cursor-pointer text-[12px] text-[var(--admin-plum-soft)]">
                        تعديل البيانات
                      </summary>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                        <Field label="اسم المستخدم">
                          <input
                            defaultValue={e.username || ""}
                            className={fieldClass}
                            dir="ltr"
                            id={`username-${e.id}`}
                            placeholder="اختياري"
                            autoComplete="off"
                          />
                        </Field>
                        <Field label="كلمة مرور جديدة">
                          <input
                            type="password"
                            className={fieldClass}
                            dir="ltr"
                            id={`password-${e.id}`}
                            placeholder={
                              e.hasLogin
                                ? "اتركيها فارغة للإبقاء"
                                : "٦ أحرف على الأقل"
                            }
                            autoComplete="new-password"
                          />
                        </Field>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AdminButton
                          size="sm"
                          disabled={pending}
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
                            const username = (
                              document.getElementById(
                                `username-${e.id}`,
                              ) as HTMLInputElement
                            ).value.trim();
                            const password = (
                              document.getElementById(
                                `password-${e.id}`,
                              ) as HTMLInputElement
                            ).value;
                            void patchEmployee(e.id, {
                              name,
                              phone,
                              role,
                              branchId,
                              baseSalary,
                              username: username || null,
                              ...(password.trim()
                                ? { password: password.trim() }
                                : {}),
                            });
                          }}
                        >
                          حفظ التعديلات
                        </AdminButton>
                        {e.hasLogin ? (
                          <AdminButton
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            onClick={() =>
                              void patchEmployee(e.id, {
                                clearLogin: true,
                              })
                            }
                          >
                            إزالة حساب الدخول
                          </AdminButton>
                        ) : null}
                        <AdminButton
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          onClick={() =>
                            void patchEmployee(e.id, {
                              isActive: !e.isActive,
                            })
                          }
                        >
                          {e.isActive ? "إيقاف" : "تفعيل"}
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="danger"
                          disabled={pending}
                          onClick={() => void removeEmployee(e.id)}
                        >
                          حذف
                        </AdminButton>
                      </div>
                    </details>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "attendance" ? (
        <section className="space-y-4">
          <Surface>
            <div className="flex flex-wrap items-end gap-3">
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
          </Surface>

          {activeEmployees.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="لا يوجد موظفون مطابقون"
              description="راجعي الفرع أو أضيفي موظفين نشطين."
            />
          ) : (
            <ul className="space-y-2.5">
              {activeEmployees.map((e) => {
                const row = attendanceMap.get(e.id);
                const status = row?.status;
                return (
                  <li key={e.id}>
                    <Surface>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-surface-soft)] text-[11px] font-semibold text-[var(--admin-plum)]">
                            {initials(e.name)}
                          </span>
                          <div>
                            <p className="text-[14px] font-semibold text-[var(--admin-text)]">
                              {e.name}
                            </p>
                            <p className="mt-0.5 text-[12px] text-[var(--admin-text-secondary)]">
                              {e.branchName} · {roleLabel(e.role)}
                              {status
                                ? ` · ${attendanceLabel(status)}`
                                : " · لم يُسجَّل بعد"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ATTENDANCE_STATUSES.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                void setAttendanceStatus(e.id, s.id)
                              }
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40 ${
                                status === s.id
                                  ? "bg-[var(--admin-plum)] text-white"
                                  : "border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)]"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Surface>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "payroll" ? (
        <section className="space-y-4">
          <Surface>
            <div className="flex flex-wrap items-end gap-3">
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
            </div>
            <p className="mt-3 text-[12px] text-[var(--admin-text-muted)]">
              الحساب: راتب أساسي ÷ {PAYROLL_DAYS} − غياب/نصف يوم − سلف وخصومات +
              مكافآت.
            </p>
          </Surface>

          <Surface>
            <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
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
                    .filter((emp) => emp.isActive)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} · {emp.branchName}
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
            <AdminButton
              className="mt-4"
              disabled={pending}
              onClick={() => void addSalaryItem()}
            >
              إضافة البند
            </AdminButton>
          </Surface>

          {filteredPayroll.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="لا توجد رواتب لهذا الفرع/الشهر"
              description="أضيفي موظفين نشطين أولاً."
            />
          ) : (
            <ul className="space-y-2.5">
              {filteredPayroll.map((r) => (
                <li key={r.employeeId}>
                  <Surface>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-surface-soft)] text-[11px] font-semibold text-[var(--admin-plum)]">
                          {initials(r.employeeName)}
                        </span>
                        <div>
                          <h3 className="text-[14px] font-semibold text-[var(--admin-text)]">
                            {r.employeeName}
                          </h3>
                          <p className="mt-0.5 text-[12px] text-[var(--admin-text-secondary)]">
                            {r.branchName} · {roleLabel(r.role)} · أساسي{" "}
                            {formatPrice(r.baseSalary)}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--admin-text-muted)]">
                            حاضر {r.presentDays} · متأخر {r.lateDays} · نصف{" "}
                            {r.halfDays} · إجازة {r.leaveDays} · غياب{" "}
                            {r.absentDays}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="admin-num text-[15px] font-semibold text-[var(--admin-text)]">
                          {formatPrice(r.netSalary)}
                        </p>
                        <p className="text-[11px] text-[var(--admin-text-muted)]">
                          صافي
                        </p>
                        {r.attendanceDeduction > 0 ? (
                          <p className="mt-1 text-[11px] text-[var(--admin-danger)]">
                            خصم حضور −{formatPrice(r.attendanceDeduction)}
                          </p>
                        ) : null}
                        {r.advances > 0 ? (
                          <p className="text-[11px] text-[var(--admin-text-muted)]">
                            سلف −{formatPrice(r.advances)}
                          </p>
                        ) : null}
                        {r.bonuses > 0 ? (
                          <p className="text-[11px] text-[var(--admin-success)]">
                            مكافآت +{formatPrice(r.bonuses)}
                          </p>
                        ) : null}
                        {r.deductions > 0 ? (
                          <p className="text-[11px] text-[var(--admin-danger)]">
                            خصومات −{formatPrice(r.deductions)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}

          {salaryItems.length > 0 ? (
            <Surface>
              <h3 className="text-[14px] font-semibold text-[var(--admin-text)]">
                بنود الشهر ({month || currentMonthKey()})
              </h3>
              <ul className="mt-3 space-y-2">
                {salaryItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-[var(--admin-text)]">
                        {item.employeeName} · {salaryTypeLabel(item.type)} ·{" "}
                        <span className="admin-num">
                          {formatPrice(item.amount)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]">
                        {item.date}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </p>
                    </div>
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => void removeSalaryItem(item.id)}
                      className="text-[var(--admin-danger)]"
                    >
                      حذف
                    </AdminButton>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}
        </section>
      ) : null}
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
    <label className="block text-[12px] text-[var(--admin-text-secondary)]">
      {label}
      {children}
    </label>
  );
}

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-2 py-0.5 text-[10px] font-medium"
      title={online ? "نشط على الموقع" : "غير متصل"}
    >
      <span
        className={`size-2 rounded-full ${
          online
            ? "bg-[var(--admin-success)] shadow-[0_0_0_3px_var(--admin-success-bg)]"
            : "bg-[#b0a6ad]"
        }`}
        aria-hidden
      />
      <span
        className={
          online
            ? "text-[var(--admin-success)]"
            : "text-[var(--admin-text-muted)]"
        }
      >
        {online ? "متصل" : "غير متصل"}
      </span>
    </span>
  );
}
