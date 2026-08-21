"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavLinks } from "@/constants/brand";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { cn } from "@/lib/utils";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.5h-3.6V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShop({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 8Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinejoin="round"
      />
      <path
        d="M8 8V6.5A4 4 0 0 1 12 2.5 4 4 0 0 1 16 6.5V8"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLarissa({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
      />
      <path
        d="M16.2 16.2 21 21"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAccount({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
      />
      <path
        d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

const icons = {
  home: IconHome,
  shop: IconShop,
  advisor: IconLarissa,
  account: IconAccount,
} as const;

export function PrimaryBottomNav() {
  const pathname = usePathname();
  const { customer } = useCustomerAuth();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--plum)]/10 bg-[var(--background)]/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="التنقل الرئيسي"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
        {primaryNavLinks.map((link) => {
          const href =
            link.id === "account"
              ? customer
                ? "/account"
                : "/login"
              : link.href;
          const active =
            link.id === "home"
              ? pathname === "/"
              : link.id === "account"
                ? pathname.startsWith("/account") ||
                  pathname.startsWith("/login") ||
                  pathname.startsWith("/register")
                : pathname.startsWith(link.href);
          const Icon = icons[link.id];
          return (
            <li key={link.id}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2 transition-colors",
                  active
                    ? "text-[var(--plum)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]",
                )}
              >
                <Icon active={active} />
                <span className="t1 font-medium tracking-[0.04em]">
                  {link.labelAr}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
