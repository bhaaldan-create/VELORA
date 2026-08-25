export type AdminNavId =
  | "overview"
  | "ai"
  | "sales"
  | "orders"
  | "products"
  | "inventory"
  | "brands"
  | "suppliers"
  | "imports"
  | "expenses"
  | "payroll"
  | "profitability"
  | "finance"
  | "analytics"
  | "reports"
  | "alerts"
  | "customers"
  | "shipping"
  | "payments"
  | "whatsapp"
  | "employees"
  | "branches"
  | "marketing"
  | "notifications"
  | "homepage"
  | "club"
  | "my-velora"
  | "settings";

export type AdminNavItem = {
  id: AdminNavId;
  href: string;
  labelAr: string;
  labelEn: string;
  icon: AdminNavId;
  group: "main" | "commerce" | "ops" | "finance" | "intelligence" | "people" | "system";
};

export const ADMIN_NAV: AdminNavItem[] = [
  { id: "overview", href: "/admin", labelAr: "نظرة عامة", labelEn: "Overview", icon: "overview", group: "main" },
  { id: "ai", href: "/admin/ai", labelAr: "وكيل الأعمال الذكي", labelEn: "AI Business Agent", icon: "ai", group: "main" },
  { id: "sales", href: "/admin/sales", labelAr: "المبيعات", labelEn: "Sales", icon: "sales", group: "commerce" },
  { id: "orders", href: "/admin/orders", labelAr: "الطلبات", labelEn: "Orders", icon: "orders", group: "commerce" },
  { id: "products", href: "/admin/products", labelAr: "المنتجات", labelEn: "Products", icon: "products", group: "commerce" },
  { id: "inventory", href: "/admin/inventory", labelAr: "المخزون", labelEn: "Inventory", icon: "inventory", group: "ops" },
  { id: "brands", href: "/admin/brands", labelAr: "العلامات", labelEn: "Brands", icon: "brands", group: "ops" },
  { id: "suppliers", href: "/admin/suppliers", labelAr: "الموردون", labelEn: "Suppliers", icon: "suppliers", group: "ops" },
  { id: "imports", href: "/admin/imports", labelAr: "الاستيراد", labelEn: "Imports", icon: "imports", group: "ops" },
  { id: "expenses", href: "/admin/expenses", labelAr: "التكاليف والمصروفات", labelEn: "Costs & Expenses", icon: "expenses", group: "finance" },
  { id: "payroll", href: "/admin/payroll", labelAr: "الرواتب", labelEn: "Payroll", icon: "payroll", group: "finance" },
  { id: "profitability", href: "/admin/profitability", labelAr: "الربحية", labelEn: "Profitability", icon: "profitability", group: "finance" },
  { id: "finance", href: "/admin/finance", labelAr: "التدفق النقدي", labelEn: "Cash Flow", icon: "finance", group: "finance" },
  { id: "analytics", href: "/admin/analytics", labelAr: "التحليلات", labelEn: "Analytics", icon: "analytics", group: "intelligence" },
  { id: "reports", href: "/admin/reports", labelAr: "التقارير", labelEn: "Reports", icon: "reports", group: "intelligence" },
  { id: "alerts", href: "/admin/alerts", labelAr: "التنبيهات", labelEn: "Alerts", icon: "alerts", group: "intelligence" },
  { id: "customers", href: "/admin/customers", labelAr: "العملاء", labelEn: "Customers", icon: "customers", group: "people" },
  { id: "employees", href: "/admin/employees", labelAr: "الموظفون", labelEn: "Employees", icon: "employees", group: "people" },
  { id: "branches", href: "/admin/branches", labelAr: "الفروع", labelEn: "Branches", icon: "branches", group: "people" },
  { id: "shipping", href: "/admin/shipping", labelAr: "الشحن", labelEn: "Shipping", icon: "shipping", group: "system" },
  { id: "payments", href: "/admin/payments", labelAr: "المدفوعات", labelEn: "Payments", icon: "payments", group: "system" },
  { id: "whatsapp", href: "/admin/whatsapp", labelAr: "واتساب", labelEn: "WhatsApp", icon: "whatsapp", group: "system" },
  { id: "marketing", href: "/admin/marketing", labelAr: "التسويق", labelEn: "Marketing", icon: "marketing", group: "system" },
  { id: "notifications", href: "/admin/notifications", labelAr: "الإشعارات", labelEn: "Notifications", icon: "notifications", group: "system" },
  { id: "homepage", href: "/admin/homepage", labelAr: "الصفحة الرئيسية", labelEn: "Homepage", icon: "homepage", group: "system" },
  { id: "club", href: "/admin/club", labelAr: "نادي الجمال", labelEn: "Beauty Club", icon: "club", group: "system" },
  { id: "my-velora", href: "/admin/my-velora", labelAr: "MY VELORA Studio", labelEn: "MY VELORA Studio", icon: "my-velora", group: "system" },
  { id: "settings", href: "/admin/settings", labelAr: "الإعدادات", labelEn: "Settings", icon: "settings", group: "system" },
];

export const ADMIN_NAV_GROUPS: {
  id: AdminNavItem["group"];
  label: string;
}[] = [
  { id: "main", label: "لوحة القيادة" },
  { id: "commerce", label: "التجارة" },
  { id: "ops", label: "التوريد والمخزون" },
  { id: "finance", label: "المالية" },
  { id: "intelligence", label: "الذكاء والتقارير" },
  { id: "people", label: "الفريق والعملاء" },
  { id: "system", label: "النظام" },
];

export const MOBILE_TAB_IDS = [
  "overview",
  "orders",
  "products",
  "ai",
] as const;
