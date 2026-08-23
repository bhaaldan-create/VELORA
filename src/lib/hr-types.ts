export const EMPLOYEE_ROLES = [
  { id: "manager", label: "مدير" },
  { id: "cashier", label: "كاشير" },
  { id: "warehouse", label: "مستودع" },
  { id: "delivery", label: "توصيل" },
  { id: "advisor", label: "مستشارة جمال" },
  { id: "other", label: "أخرى" },
] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]["id"];

export const ATTENDANCE_STATUSES = [
  { id: "present", label: "حاضر", deductDays: 0 },
  { id: "late", label: "متأخر", deductDays: 0 },
  { id: "half", label: "نصف يوم", deductDays: 0.5 },
  { id: "leave", label: "إجازة", deductDays: 0 },
  { id: "absent", label: "غياب", deductDays: 1 },
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]["id"];

export const SALARY_ITEM_TYPES = [
  { id: "advance", label: "سلفة" },
  { id: "bonus", label: "مكافأة" },
  { id: "deduction", label: "خصم" },
] as const;

export type SalaryItemType = (typeof SALARY_ITEM_TYPES)[number]["id"];

/** أيام الشهر المعتمدة لحساب الراتب اليومي */
export const PAYROLL_DAYS = 30;

export type AdminBranch = {
  id: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type AdminEmployee = {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  baseSalary: number;
  hireDate: string;
  isActive: boolean;
  notes: string;
  branchId: string;
  branchName: string;
  /** اسم مستخدم الدخول — إن وُجد */
  username: string | null;
  /** هل لديه كلمة مرور مضبوطة */
  hasLogin: boolean;
  /** نشط الآن داخل لوحة الإدارة (آخر ظهور ≤ 5 دقائق) */
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAttendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  date: string;
  status: AttendanceStatus;
  note: string;
};

export type AdminSalaryItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  monthKey: string;
  type: SalaryItemType;
  amount: number;
  reason: string;
  date: string;
};

export type PayrollRow = {
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  role: EmployeeRole;
  baseSalary: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  absentDays: number;
  deductedDays: number;
  attendanceDeduction: number;
  advances: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
};

export type HrStats = {
  employees: number;
  active: number;
  inactive: number;
  branches: number;
  todayPresent: number;
  todayAbsent: number;
  todayUnset: number;
  monthPayrollTotal: number;
};

/** الفروع الابتدائية — تُنشأ تلقائياً إن لم توجد */
export const DEFAULT_BRANCHES = [
  {
    id: "br_anbar",
    name: "الأنبار",
    city: "الأنبار",
    address: "",
    sortOrder: 1,
  },
  {
    id: "br_baghdad_amiriya",
    name: "بغداد - العامرية",
    city: "بغداد",
    address: "العامرية",
    sortOrder: 2,
  },
] as const;

export function roleLabel(role: string) {
  return EMPLOYEE_ROLES.find((r) => r.id === role)?.label ?? role;
}

export function attendanceLabel(status: string) {
  return ATTENDANCE_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function salaryTypeLabel(type: string) {
  return SALARY_ITEM_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function isEmployeeRole(value: string): value is EmployeeRole {
  return EMPLOYEE_ROLES.some((r) => r.id === value);
}

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return ATTENDANCE_STATUSES.some((s) => s.id === value);
}

export function isSalaryItemType(value: string): value is SalaryItemType {
  return SALARY_ITEM_TYPES.some((t) => t.id === value);
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKeyFromDate(dateKey: string) {
  return dateKey.slice(0, 7);
}

export function currentMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
