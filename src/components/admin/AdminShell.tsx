"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { CommandPalette } from "@/components/admin/ui/CommandPalette";
import { AdminToastProvider } from "@/components/admin/ui/Toast";
import {
  AdminNavIcon,
  Bell,
  Menu,
  PanelLeft,
  Search,
  Store,
  X,
} from "@/components/admin/ui/icons";
import {
  ADMIN_NAV,
  ADMIN_NAV_GROUPS,
  MOBILE_TAB_IDS,
  type AdminNavId,
} from "@/lib/admin/nav";

type Props = {
  title?: string;
  subtitle?: string;
  active?: AdminNavId;
  children: ReactNode;
};

function resolveActive(pathname: string, active?: AdminNavId): AdminNavId {
  if (active) return active;
  if (pathname === "/admin" || pathname === "/admin/") return "overview";
  const match = ADMIN_NAV.find(
    (n) => n.href !== "/admin" && pathname.startsWith(n.href),
  );
  return match?.id ?? "overview";
}

export function AdminShell({ title, subtitle, active, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const current = resolveActive(pathname, active);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("velora-admin-sidebar");
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("velora-admin-sidebar", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const navByGroup = useMemo(() => {
    return ADMIN_NAV_GROUPS.map((g) => ({
      ...g,
      items: ADMIN_NAV.filter((n) => n.group === g.id),
    })).filter((g) => g.items.length > 0);
  }, []);

  const pageTitle =
    title || ADMIN_NAV.find((n) => n.id === current)?.labelAr || "VELORA";

  return (
    <AdminToastProvider>
      <div className="admin-os" dir="rtl">
        {/* Desktop sidebar */}
        <aside
          className={`fixed inset-y-0 end-0 z-40 hidden border-s border-[var(--admin-border)] bg-[var(--admin-surface)] transition-[width] duration-200 lg:flex lg:flex-col ${
            collapsed
              ? "w-[var(--admin-sidebar-collapsed)]"
              : "w-[var(--admin-sidebar-w)]"
          }`}
        >
          <div
            className={`flex h-[var(--admin-topbar-h)] items-center border-b border-[var(--admin-border)] ${
              collapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.2em] text-[var(--admin-text-muted)]">
                  VELORA
                </p>
                <p className="text-[13px] font-semibold text-[var(--admin-plum)]">
                  Admin OS
                </p>
              </div>
            ) : (
              <span className="text-[11px] font-semibold tracking-widest text-[var(--admin-plum)]">
                V
              </span>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex size-8 items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
              aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              <PanelLeft className="size-4" strokeWidth={1.6} />
            </button>
          </div>

          <nav className="admin-scroll flex-1 overflow-y-auto px-2 py-3">
            {navByGroup.map((group) => (
              <div key={group.id} className="mb-4">
                {!collapsed ? (
                  <p className="mb-1.5 px-2 text-[10px] font-medium tracking-wide text-[var(--admin-text-muted)]">
                    {group.label}
                  </p>
                ) : null}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.id === current;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          title={item.labelAr}
                          className={`flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] transition ${
                            isActive
                              ? "bg-[var(--admin-plum)] text-white"
                              : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
                          } ${collapsed ? "justify-center px-0" : ""}`}
                        >
                          <AdminNavIcon
                            id={item.id}
                            className="size-4 shrink-0"
                          />
                          {!collapsed ? (
                            <span className="truncate font-medium">
                              {item.labelAr}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div
            className={`border-t border-[var(--admin-border)] p-2 ${
              collapsed ? "flex flex-col items-center gap-1" : "space-y-1"
            }`}
          >
            <Link
              href="/"
              className={`flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)] ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <Store className="size-4" strokeWidth={1.6} />
              {!collapsed ? <span>المتجر</span> : null}
            </Link>
            {!collapsed ? (
              <div className="px-1">
                <AdminLogoutButton />
              </div>
            ) : null}
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[rgba(44,35,48,0.4)]"
              aria-label="إغلاق"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 end-0 flex w-[min(100%,18rem)] flex-col bg-[var(--admin-surface)] shadow-[var(--admin-shadow-md)] admin-animate-in">
              <div className="flex h-[var(--admin-topbar-h)] items-center justify-between border-b border-[var(--admin-border)] px-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-[var(--admin-text-muted)]">
                    VELORA
                  </p>
                  <p className="text-[13px] font-semibold text-[var(--admin-plum)]">
                    Admin OS
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-[var(--admin-text-muted)]"
                  aria-label="إغلاق"
                >
                  <X className="size-4" />
                </button>
              </div>
              <nav className="admin-scroll flex-1 overflow-y-auto px-2 py-3">
                {ADMIN_NAV.map((item) => {
                  const isActive = item.id === current;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`mb-0.5 flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] ${
                        isActive
                          ? "bg-[var(--admin-plum)] text-white"
                          : "text-[var(--admin-text-secondary)]"
                      }`}
                    >
                      <AdminNavIcon id={item.id} />
                      <span className="font-medium">{item.labelAr}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="space-y-2 border-t border-[var(--admin-border)] p-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-[13px] text-[var(--admin-text-secondary)]"
                >
                  <Store className="size-4" />
                  المتجر
                </Link>
                <AdminLogoutButton />
              </div>
            </div>
          </div>
        ) : null}

        {/* Main column */}
        <div
          className={`flex min-h-dvh flex-col transition-[padding] duration-200 ${
            collapsed
              ? "lg:pe-[var(--admin-sidebar-collapsed)]"
              : "lg:pe-[var(--admin-sidebar-w)]"
          }`}
        >
          <header className="sticky top-0 z-30 flex h-[var(--admin-topbar-h)] items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-bg-elevated)]/90 px-3 backdrop-blur-md sm:px-5">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="القائمة"
            >
              <Menu className="size-[18px]" strokeWidth={1.6} />
            </button>

            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-start text-[13px] text-[var(--admin-text-muted)] transition hover:border-[var(--admin-border-strong)] sm:max-w-md"
            >
              <Search className="size-3.5 shrink-0" strokeWidth={1.6} />
              <span className="truncate">بحث أو أمر…</span>
              <kbd className="ms-auto hidden rounded border border-[var(--admin-border)] px-1.5 py-0.5 text-[10px] text-[var(--admin-text-muted)] sm:inline">
                ⌘K
              </kbd>
            </button>

            <div className="ms-auto flex items-center gap-1">
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-lg text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)]"
                aria-label="الإشعارات"
                onClick={() => router.push("/admin/orders?status=new")}
              >
                <Bell className="size-4" strokeWidth={1.6} />
              </button>
            </div>
          </header>

          <main className="admin-animate-in flex-1 px-3 pb-24 pt-5 sm:px-5 sm:pb-8 lg:px-7">
            {(title || subtitle) && current !== "overview" ? (
              <div className="mb-5 lg:hidden">
                <h1 className="text-[1.25rem] font-semibold text-[var(--admin-text)]">
                  {pageTitle}
                </h1>
                {subtitle ? (
                  <p className="mt-1 text-[13px] text-[var(--admin-text-secondary)]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : null}
            {children}
          </main>
        </div>

        {/* Mobile bottom tabs */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--admin-border)] bg-[var(--admin-surface)]/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]">
          <ul className="grid grid-cols-5">
            {MOBILE_TAB_IDS.map((id) => {
              const item = ADMIN_NAV.find((n) => n.id === id)!;
              const isActive = current === id;
              return (
                <li key={id}>
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                      isActive
                        ? "text-[var(--admin-plum)]"
                        : "text-[var(--admin-text-muted)]"
                    }`}
                  >
                    <AdminNavIcon id={id} className="size-[18px]" />
                    <span>{item.labelAr}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex w-full flex-col items-center gap-0.5 py-2 text-[10px] text-[var(--admin-text-muted)]"
              >
                <Menu className="size-[18px]" strokeWidth={1.6} />
                <span>المزيد</span>
              </button>
            </li>
          </ul>
        </nav>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      </div>
    </AdminToastProvider>
  );
}
