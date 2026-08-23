import { prisma } from "@/lib/db";
import { isEmployeeOnline } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/customer-auth";
import {
  ATTENDANCE_STATUSES,
  DEFAULT_BRANCHES,
  PAYROLL_DAYS,
  type AdminAttendance,
  type AdminBranch,
  type AdminEmployee,
  type AdminSalaryItem,
  type AttendanceStatus,
  type EmployeeRole,
  type HrStats,
  type PayrollRow,
  type SalaryItemType,
  currentMonthKey,
  isAttendanceStatus,
  isEmployeeRole,
  isSalaryItemType,
  todayKey,
} from "@/lib/hr-types";

function mapBranch(row: {
  id: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { employees: number };
}): AdminBranch {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    employeeCount: row._count?.employees ?? 0,
  };
}

function mapEmployee(row: {
  id: string;
  name: string;
  phone: string;
  role: string;
  baseSalary: number;
  hireDate: string;
  isActive: boolean;
  notes: string;
  username: string | null;
  passwordHash: string | null;
  lastSeenAt: Date | null;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  branch: { name: string };
}): AdminEmployee {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: (isEmployeeRole(row.role) ? row.role : "other") as EmployeeRole,
    baseSalary: row.baseSalary,
    hireDate: row.hireDate,
    isActive: row.isActive,
    notes: row.notes,
    branchId: row.branchId,
    branchName: row.branch.name,
    username: row.username,
    hasLogin: Boolean(row.username && row.passwordHash),
    isOnline: isEmployeeOnline(row.lastSeenAt),
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeUsername(raw: string) {
  return raw.trim();
}

function mapAttendance(row: {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  note: string;
  employee: { name: string; branchId: string; branch: { name: string } };
}): AdminAttendance {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee.name,
    branchId: row.employee.branchId,
    branchName: row.employee.branch.name,
    date: row.date,
    status: (isAttendanceStatus(row.status) ? row.status : "present") as AttendanceStatus,
    note: row.note,
  };
}

function mapSalaryItem(row: {
  id: string;
  employeeId: string;
  monthKey: string;
  type: string;
  amount: number;
  reason: string;
  date: string;
  employee: { name: string };
}): AdminSalaryItem {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee.name,
    monthKey: row.monthKey,
    type: (isSalaryItemType(row.type) ? row.type : "deduction") as SalaryItemType,
    amount: row.amount,
    reason: row.reason,
    date: row.date,
  };
}

/** يضمن وجود الفرعين الابتدائيين */
export async function ensureDefaultBranches() {
  for (const b of DEFAULT_BRANCHES) {
    await prisma.branch.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        name: b.name,
        city: b.city,
        address: b.address,
        sortOrder: b.sortOrder,
        isActive: true,
      },
      update: {
        name: b.name,
        city: b.city,
        address: b.address,
        sortOrder: b.sortOrder,
      },
    });
  }
}

const DEFAULT_STAFF_LOGINS = [
  {
    username: "MuhammadBahaa",
    password: "tabarakeyes",
    name: "محمد بهاء",
    role: "manager" as EmployeeRole,
  },
  {
    username: "Ahmedmazin",
    password: "55668899",
    name: "أحمد مازن",
    role: "manager" as EmployeeRole,
  },
  {
    username: "YousefWathiq",
    password: "55772211",
    name: "يوسف واثق",
    role: "manager" as EmployeeRole,
  },
] as const;

/** يضمن حسابات الدخول الابتدائية للفريق */
export async function ensureDefaultStaffLogins() {
  await ensureDefaultBranches();
  const branch =
    (await prisma.branch.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })) || (await prisma.branch.findFirst({ orderBy: { sortOrder: "asc" } }));
  if (!branch) return;

  for (const staff of DEFAULT_STAFF_LOGINS) {
    const existing = await prisma.employee.findUnique({
      where: { username: staff.username },
    });
    if (existing) {
      if (!existing.passwordHash || !existing.isActive) {
        await prisma.employee.update({
          where: { id: existing.id },
          data: {
            passwordHash:
              existing.passwordHash || (await hashPassword(staff.password)),
            isActive: true,
            name: existing.name || staff.name,
          },
        });
      }
      continue;
    }

    const byName = await prisma.employee.findFirst({
      where: { name: staff.name, username: null },
    });
    if (byName) {
      await prisma.employee.update({
        where: { id: byName.id },
        data: {
          username: staff.username,
          passwordHash: await hashPassword(staff.password),
          role: staff.role,
          isActive: true,
        },
      });
      continue;
    }

    await prisma.employee.create({
      data: {
        name: staff.name,
        username: staff.username,
        passwordHash: await hashPassword(staff.password),
        role: staff.role,
        baseSalary: 0,
        hireDate: todayKey(),
        phone: "",
        notes: "حساب دخول لوحة الإدارة",
        branchId: branch.id,
        isActive: true,
      },
    });
  }
}

export async function findEmployeeByUsername(username: string) {
  const u = normalizeUsername(username);
  if (!u) return null;
  // case-insensitive match
  const rows = await prisma.employee.findMany({
    where: { username: { not: null } },
    select: {
      id: true,
      name: true,
      username: true,
      passwordHash: true,
      isActive: true,
    },
  });
  const hit = rows.find(
    (r) => r.username && r.username.toLowerCase() === u.toLowerCase(),
  );
  return hit ?? null;
}

export async function touchEmployeePresence(employeeId: string) {
  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { lastSeenAt: new Date() },
    });
  } catch {
    // موظف محذوف أو جلسة قديمة — تجاهل
  }
}

export async function listBranches(): Promise<AdminBranch[]> {
  await ensureDefaultBranches();
  const rows = await prisma.branch.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { employees: true } } },
  });
  return rows.map(mapBranch);
}

export async function createBranch(data: {
  name: string;
  city?: string;
  address?: string;
}): Promise<AdminBranch> {
  const count = await prisma.branch.count();
  const row = await prisma.branch.create({
    data: {
      name: data.name.trim(),
      city: (data.city || "").trim(),
      address: (data.address || "").trim(),
      sortOrder: count + 1,
      isActive: true,
    },
    include: { _count: { select: { employees: true } } },
  });
  return mapBranch(row);
}

export async function updateBranch(
  id: string,
  data: Partial<{
    name: string;
    city: string;
    address: string;
    isActive: boolean;
  }>,
): Promise<AdminBranch | null> {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) return null;

  const row = await prisma.branch.update({
    where: { id },
    data: {
      ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
      ...(typeof data.city === "string" ? { city: data.city.trim() } : {}),
      ...(typeof data.address === "string"
        ? { address: data.address.trim() }
        : {}),
      ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
    },
    include: { _count: { select: { employees: true } } },
  });
  return mapBranch(row);
}

export async function deleteBranch(id: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const existing = await prisma.branch.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });
  if (!existing) return { ok: false, error: "الفرع غير موجود." };
  if (existing._count.employees > 0) {
    return {
      ok: false,
      error: "لا يمكن حذف فرع مرتبط بموظفين. انقلي الموظفين أولاً أو أوقفي الفرع.",
    };
  }
  await prisma.branch.delete({ where: { id } });
  return { ok: true };
}

export async function listEmployees(): Promise<AdminEmployee[]> {
  await ensureDefaultBranches();
  await ensureDefaultStaffLogins();
  const rows = await prisma.employee.findMany({
    include: { branch: { select: { name: true } } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return rows.map(mapEmployee);
}

export async function createEmployee(data: {
  name: string;
  phone?: string;
  role?: EmployeeRole;
  baseSalary?: number;
  hireDate?: string;
  notes?: string;
  branchId: string;
  username?: string;
  password?: string;
}): Promise<AdminEmployee> {
  await ensureDefaultBranches();
  const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
  if (!branch || !branch.isActive) {
    throw new Error("الفرع غير موجود أو غير نشط.");
  }

  const username = data.username ? normalizeUsername(data.username) : null;
  if (username) {
    const taken = await prisma.employee.findUnique({ where: { username } });
    if (taken) throw new Error("اسم المستخدم مستخدم مسبقاً.");
  }
  if (username && !data.password?.trim()) {
    throw new Error("كلمة المرور مطلوبة مع اسم المستخدم.");
  }

  const row = await prisma.employee.create({
    data: {
      name: data.name.trim(),
      phone: (data.phone || "").trim(),
      role: data.role || "other",
      baseSalary: Math.max(0, Math.round(data.baseSalary || 0)),
      hireDate: data.hireDate || todayKey(),
      notes: (data.notes || "").trim(),
      branchId: data.branchId,
      username,
      passwordHash:
        username && data.password?.trim()
          ? await hashPassword(data.password.trim())
          : null,
    },
    include: { branch: { select: { name: true } } },
  });
  return mapEmployee(row);
}

export async function updateEmployee(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    role: EmployeeRole;
    baseSalary: number;
    hireDate: string;
    isActive: boolean;
    notes: string;
    branchId: string;
    username: string | null;
    password: string;
    clearLogin: boolean;
  }>,
): Promise<AdminEmployee | null> {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return null;

  if (data.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });
    if (!branch) throw new Error("الفرع غير موجود.");
  }

  let usernameUpdate: string | null | undefined;
  if (data.clearLogin) {
    usernameUpdate = null;
  } else if (typeof data.username === "string") {
    const u = normalizeUsername(data.username);
    usernameUpdate = u || null;
    if (usernameUpdate) {
      const taken = await prisma.employee.findFirst({
        where: { username: usernameUpdate, NOT: { id } },
      });
      if (taken) throw new Error("اسم المستخدم مستخدم مسبقاً.");
    }
  }

  const nextUsername =
    usernameUpdate !== undefined ? usernameUpdate : existing.username;

  let passwordHash: string | null | undefined;
  if (data.clearLogin) {
    passwordHash = null;
  } else if (typeof data.password === "string" && data.password.trim()) {
    passwordHash = await hashPassword(data.password.trim());
  } else if (usernameUpdate === null) {
    passwordHash = null;
  }

  if (nextUsername && !existing.passwordHash && !passwordHash && !data.clearLogin) {
    // تعيين يوزرنيم جديد بدون كلمة مرور غير مسموح
    if (typeof data.password !== "string" || !data.password.trim()) {
      throw new Error("أدخلي كلمة مرور عند تعيين اسم المستخدم.");
    }
  }

  const row = await prisma.employee.update({
    where: { id },
    data: {
      ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
      ...(typeof data.phone === "string" ? { phone: data.phone.trim() } : {}),
      ...(data.role ? { role: data.role } : {}),
      ...(typeof data.baseSalary === "number"
        ? { baseSalary: Math.max(0, Math.round(data.baseSalary)) }
        : {}),
      ...(typeof data.hireDate === "string" ? { hireDate: data.hireDate } : {}),
      ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
      ...(typeof data.notes === "string" ? { notes: data.notes.trim() } : {}),
      ...(typeof data.branchId === "string" ? { branchId: data.branchId } : {}),
      ...(usernameUpdate !== undefined ? { username: usernameUpdate } : {}),
      ...(passwordHash !== undefined ? { passwordHash } : {}),
    },
    include: { branch: { select: { name: true } } },
  });
  return mapEmployee(row);
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.employee.delete({ where: { id } });
  return true;
}

export async function listAttendanceByDate(
  date: string,
): Promise<AdminAttendance[]> {
  const rows = await prisma.attendance.findMany({
    where: { date },
    include: {
      employee: {
        select: {
          name: true,
          branchId: true,
          branch: { select: { name: true } },
        },
      },
    },
    orderBy: { employee: { name: "asc" } },
  });
  return rows.map(mapAttendance);
}

export async function upsertAttendance(data: {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}): Promise<AdminAttendance> {
  const row = await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: data.date,
      },
    },
    create: {
      employeeId: data.employeeId,
      date: data.date,
      status: data.status,
      note: (data.note || "").trim(),
    },
    update: {
      status: data.status,
      note: (data.note || "").trim(),
    },
    include: {
      employee: {
        select: {
          name: true,
          branchId: true,
          branch: { select: { name: true } },
        },
      },
    },
  });
  return mapAttendance(row);
}

export async function listSalaryItems(monthKey: string): Promise<AdminSalaryItem[]> {
  const rows = await prisma.salaryItem.findMany({
    where: { monthKey },
    include: { employee: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(mapSalaryItem);
}

export async function createSalaryItem(data: {
  employeeId: string;
  monthKey: string;
  type: SalaryItemType;
  amount: number;
  reason?: string;
  date?: string;
}): Promise<AdminSalaryItem> {
  const row = await prisma.salaryItem.create({
    data: {
      employeeId: data.employeeId,
      monthKey: data.monthKey,
      type: data.type,
      amount: Math.max(0, Math.round(data.amount)),
      reason: (data.reason || "").trim(),
      date: data.date || todayKey(),
    },
    include: { employee: { select: { name: true } } },
  });
  return mapSalaryItem(row);
}

export async function deleteSalaryItem(id: string): Promise<boolean> {
  const existing = await prisma.salaryItem.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.salaryItem.delete({ where: { id } });
  return true;
}

function deductDaysForStatus(status: string) {
  return ATTENDANCE_STATUSES.find((s) => s.id === status)?.deductDays ?? 0;
}

export async function buildPayroll(monthKey: string): Promise<PayrollRow[]> {
  await ensureDefaultBranches();
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { branch: { select: { id: true, name: true } } },
    orderBy: [{ branch: { sortOrder: "asc" } }, { name: "asc" }],
  });

  const [attendances, items] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { startsWith: monthKey } },
    }),
    prisma.salaryItem.findMany({ where: { monthKey } }),
  ]);

  return employees.map((emp) => {
    const mine = attendances.filter((a) => a.employeeId === emp.id);
    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let deductedDays = 0;

    for (const a of mine) {
      deductedDays += deductDaysForStatus(a.status);
      if (a.status === "present") presentDays += 1;
      else if (a.status === "late") lateDays += 1;
      else if (a.status === "half") halfDays += 1;
      else if (a.status === "leave") leaveDays += 1;
      else if (a.status === "absent") absentDays += 1;
    }

    const daily = emp.baseSalary / PAYROLL_DAYS;
    const attendanceDeduction = Math.round(daily * deductedDays);
    const advances = items
      .filter((i) => i.employeeId === emp.id && i.type === "advance")
      .reduce((s, i) => s + i.amount, 0);
    const bonuses = items
      .filter((i) => i.employeeId === emp.id && i.type === "bonus")
      .reduce((s, i) => s + i.amount, 0);
    const deductions = items
      .filter((i) => i.employeeId === emp.id && i.type === "deduction")
      .reduce((s, i) => s + i.amount, 0);

    const netSalary = Math.max(
      0,
      emp.baseSalary - attendanceDeduction - advances - deductions + bonuses,
    );

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      branchId: emp.branchId,
      branchName: emp.branch.name,
      role: (isEmployeeRole(emp.role) ? emp.role : "other") as EmployeeRole,
      baseSalary: emp.baseSalary,
      presentDays,
      lateDays,
      halfDays,
      leaveDays,
      absentDays,
      deductedDays,
      attendanceDeduction,
      advances,
      bonuses,
      deductions,
      netSalary,
    };
  });
}

export async function getHrStats(
  date = todayKey(),
  monthKey = currentMonthKey(),
): Promise<HrStats> {
  const [employees, branches] = await Promise.all([
    listEmployees(),
    listBranches(),
  ]);
  const active = employees.filter((e) => e.isActive);
  const attendance = await listAttendanceByDate(date);
  const byId = new Map(attendance.map((a) => [a.employeeId, a]));

  let todayPresent = 0;
  let todayAbsent = 0;
  let todayUnset = 0;

  for (const e of active) {
    const row = byId.get(e.id);
    if (!row) todayUnset += 1;
    else if (row.status === "absent") todayAbsent += 1;
    else todayPresent += 1;
  }

  const payroll = await buildPayroll(monthKey);
  const monthPayrollTotal = payroll.reduce((s, r) => s + r.netSalary, 0);

  return {
    employees: employees.length,
    active: active.length,
    inactive: employees.length - active.length,
    branches: branches.filter((b) => b.isActive).length,
    todayPresent,
    todayAbsent,
    todayUnset,
    monthPayrollTotal,
  };
}
