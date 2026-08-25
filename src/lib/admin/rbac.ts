/**
 * Simple module permissions for Wave C.
 * Root always has full access. Employee.role is mapped coarsely.
 */
export type AdminModule =
  | "overview"
  | "ai"
  | "orders"
  | "products"
  | "inventory"
  | "suppliers"
  | "imports"
  | "expenses"
  | "payroll"
  | "finance"
  | "profitability"
  | "reports"
  | "settings"
  | "customers"
  | "employees";

const ROLE_MODULES: Record<string, AdminModule[]> = {
  root: [
    "overview",
    "ai",
    "orders",
    "products",
    "inventory",
    "suppliers",
    "imports",
    "expenses",
    "payroll",
    "finance",
    "profitability",
    "reports",
    "settings",
    "customers",
    "employees",
  ],
  manager: [
    "overview",
    "ai",
    "orders",
    "products",
    "inventory",
    "suppliers",
    "imports",
    "expenses",
    "payroll",
    "finance",
    "profitability",
    "reports",
    "settings",
    "customers",
    "employees",
  ],
  warehouse: [
    "overview",
    "orders",
    "products",
    "inventory",
    "imports",
    "suppliers",
  ],
  cashier: ["overview", "orders", "customers", "products"],
  finance: [
    "overview",
    "ai",
    "expenses",
    "payroll",
    "finance",
    "profitability",
    "reports",
    "orders",
    "settings",
  ],
  advisor: ["overview", "products", "customers", "orders"],
  delivery: ["overview", "orders"],
  other: [
    "overview",
    "ai",
    "orders",
    "products",
    "inventory",
    "suppliers",
    "imports",
    "expenses",
    "payroll",
    "finance",
    "profitability",
    "reports",
    "settings",
    "customers",
    "employees",
  ],
};

export function canAccessModule(
  subject: string | null | undefined,
  employeeRole: string | null | undefined,
  module: AdminModule,
): boolean {
  if (!subject || subject === "root") return true;
  if (!employeeRole || employeeRole === "root") return true;

  const role = employeeRole.toLowerCase();
  // Unknown / legacy roles must not lock the Business OS
  if (!(role in ROLE_MODULES)) return true;

  const allowed = ROLE_MODULES[role] || ROLE_MODULES.other;
  return allowed.includes(module);
}

/** Map admin pathname (or API path) → permission module. */
export function moduleForPath(pathname: string): AdminModule | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  const rules: Array<{ prefix: string; module: AdminModule }> = [
    { prefix: "/admin/ai", module: "ai" },
    { prefix: "/api/admin/ai", module: "ai" },
    { prefix: "/admin/alerts", module: "ai" },
    { prefix: "/api/admin/insights", module: "ai" },
    { prefix: "/admin/expenses", module: "expenses" },
    { prefix: "/api/admin/expenses", module: "expenses" },
    { prefix: "/admin/payroll", module: "payroll" },
    { prefix: "/admin/finance", module: "finance" },
    { prefix: "/admin/profitability", module: "profitability" },
    { prefix: "/admin/reports", module: "reports" },
    { prefix: "/admin/suppliers", module: "suppliers" },
    { prefix: "/api/admin/suppliers", module: "suppliers" },
    { prefix: "/admin/imports", module: "imports" },
    { prefix: "/api/admin/imports", module: "imports" },
    { prefix: "/admin/inventory", module: "inventory" },
    { prefix: "/admin/employees", module: "employees" },
    { prefix: "/api/admin/employees", module: "employees" },
    { prefix: "/api/admin/salary", module: "payroll" },
    { prefix: "/api/admin/attendance", module: "payroll" },
    { prefix: "/admin/settings", module: "settings" },
  ];
  for (const r of rules) {
    if (p === r.prefix || p.startsWith(`${r.prefix}/`)) return r.module;
  }
  return null;
}
