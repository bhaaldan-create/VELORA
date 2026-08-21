import Link from "next/link";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const links = [
  { href: "/admin/orders", label: "الطلبات", id: "orders" as const },
  { href: "/admin/products", label: "المنتجات", id: "products" as const },
  { href: "/admin/employees", label: "الموظفون", id: "employees" as const },
  { href: "/admin/whatsapp", label: "واتساب", id: "whatsapp" as const },
] as const;

type Props = {
  title: string;
  subtitle: string;
  active: "orders" | "products" | "employees" | "whatsapp";
  children: ReactNode;
};

export function AdminShell({ title, subtitle, active, children }: Props) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 sm:px-8" dir="rtl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            VELORA ADMIN
          </p>
          <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
            {title}
          </h1>
          <p className="t3 mt-2 text-[var(--muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="t3 text-[var(--plum)] underline-offset-4 hover:underline"
          >
            المتجر
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-[var(--plum)]/10 pb-4">
        {links.map((link) => {
          const isActive = link.id === active;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`t2 px-4 py-2 transition ${
                isActive
                  ? "bg-[var(--plum)] text-[var(--ivory)]"
                  : "border border-[var(--plum)]/15 bg-white text-[var(--plum)] hover:border-[var(--plum)]/40"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
