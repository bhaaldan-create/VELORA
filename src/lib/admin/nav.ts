export type AdminNavId =
  | "overview"
  | "orders"
  | "products"
  | "customers"
  | "shipping"
  | "payments"
  | "whatsapp"
  | "inventory"
  | "employees"
  | "branches"
  | "marketing"
  | "club"
  | "analytics"
  | "reports"
  | "settings";

export type AdminNavItem = {
  id: AdminNavId;
  href: string;
  labelAr: string;
  labelEn: string;
  icon: AdminNavId;
  group: "main" | "ops" | "people" | "insights" | "system";
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    id: "overview",
    href: "/admin",
    labelAr: "لوحة التحكم",
    labelEn: "Overview",
    icon: "overview",
    group: "main",
  },
  {
    id: "orders",
    href: "/admin/orders",
    labelAr: "الطلبات",
    labelEn: "Orders",
    icon: "orders",
    group: "main",
  },
  {
    id: "products",
    href: "/admin/products",
    labelAr: "المنتجات",
    labelEn: "Products",
    icon: "products",
    group: "main",
  },
  {
    id: "customers",
    href: "/admin/customers",
    labelAr: "العملاء",
    labelEn: "Customers",
    icon: "customers",
    group: "main",
  },
  {
    id: "shipping",
    href: "/admin/shipping",
    labelAr: "الشحن والتوصيل",
    labelEn: "Shipping",
    icon: "shipping",
    group: "ops",
  },
  {
    id: "payments",
    href: "/admin/payments",
    labelAr: "المدفوعات",
    labelEn: "Payments",
    icon: "payments",
    group: "ops",
  },
  {
    id: "whatsapp",
    href: "/admin/whatsapp",
    labelAr: "واتساب",
    labelEn: "WhatsApp",
    icon: "whatsapp",
    group: "ops",
  },
  {
    id: "inventory",
    href: "/admin/inventory",
    labelAr: "المخزون",
    labelEn: "Inventory",
    icon: "inventory",
    group: "ops",
  },
  {
    id: "employees",
    href: "/admin/employees",
    labelAr: "الموظفون",
    labelEn: "Employees",
    icon: "employees",
    group: "people",
  },
  {
    id: "branches",
    href: "/admin/branches",
    labelAr: "الفروع",
    labelEn: "Branches",
    icon: "branches",
    group: "people",
  },
  {
    id: "marketing",
    href: "/admin/marketing",
    labelAr: "التسويق",
    labelEn: "Marketing",
    icon: "marketing",
    group: "insights",
  },
  {
    id: "club",
    href: "/admin/club",
    labelAr: "نادي الجمال",
    labelEn: "Beauty Club",
    icon: "club",
    group: "insights",
  },
  {
    id: "analytics",
    href: "/admin/analytics",
    labelAr: "التحليلات",
    labelEn: "Analytics",
    icon: "analytics",
    group: "insights",
  },
  {
    id: "reports",
    href: "/admin/reports",
    labelAr: "التقارير",
    labelEn: "Reports",
    icon: "reports",
    group: "insights",
  },
  {
    id: "settings",
    href: "/admin/settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
    icon: "settings",
    group: "system",
  },
];

export const ADMIN_NAV_GROUPS: {
  id: AdminNavItem["group"];
  label: string;
}[] = [
  { id: "main", label: "الأساسي" },
  { id: "ops", label: "العمليات" },
  { id: "people", label: "الفريق" },
  { id: "insights", label: "الرؤى" },
  { id: "system", label: "النظام" },
];

export const MOBILE_TAB_IDS = [
  "overview",
  "orders",
  "products",
  "customers",
] as const;
