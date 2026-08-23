import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Truck,
  CreditCard,
  MessageCircle,
  Warehouse,
  UserCog,
  Building2,
  Megaphone,
  Gem,
  ChartColumn,
  FileText,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Check,
  X,
  Copy,
  Printer,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  PanelLeft,
  Store,
  LogOut,
  Menu,
  CalendarCheck,
  Wallet,
  Images,
  type LucideIcon,
} from "lucide-react";
import type { AdminNavId } from "@/lib/admin/nav";
import type { OrderStatusTone } from "@/lib/order-types";

const NAV_ICONS: Record<AdminNavId, LucideIcon> = {
  overview: LayoutDashboard,
  orders: ShoppingBag,
  products: Package,
  customers: Users,
  shipping: Truck,
  payments: CreditCard,
  whatsapp: MessageCircle,
  inventory: Warehouse,
  employees: UserCog,
  branches: Building2,
  marketing: Megaphone,
  homepage: Images,
  club: Gem,
  analytics: ChartColumn,
  reports: FileText,
  settings: Settings,
};

export function AdminNavIcon({
  id,
  className = "size-4",
  strokeWidth = 1.6,
}: {
  id: AdminNavId;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = NAV_ICONS[id];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

export {
  Search,
  Bell,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Check,
  X,
  Copy,
  Printer,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  PanelLeft,
  Store,
  LogOut,
  Menu,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Truck,
  CreditCard,
  MessageCircle,
  Warehouse,
  UserCog,
  Building2,
  Megaphone,
  ChartColumn,
  FileText,
  Settings,
  CalendarCheck,
  Wallet,
  Gem,
};

export type { LucideIcon };

export const TONE_BADGE: Record<OrderStatusTone, string> = {
  neutral: "bg-[var(--admin-surface-soft)] text-[var(--admin-text-secondary)]",
  info: "bg-[var(--admin-info-bg)] text-[var(--admin-info)]",
  progress: "bg-[var(--admin-warning-bg)] text-[var(--admin-warning)]",
  shipping: "bg-[var(--admin-shipping-bg)] text-[var(--admin-shipping)]",
  success: "bg-[var(--admin-success-bg)] text-[var(--admin-success)]",
  warning: "bg-[var(--admin-warning-bg)] text-[var(--admin-warning)]",
  danger: "bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]",
};
