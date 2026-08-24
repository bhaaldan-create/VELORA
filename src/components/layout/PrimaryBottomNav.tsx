"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavLinks } from "@/constants/brand";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useCheckoutUI } from "@/context/CheckoutUIContext";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";
import { isAuthRoute } from "@/components/auth/auth-utils";

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

function IconSearch({ active }: { active: boolean }) {
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

function IconLarissa({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.2 13.2 8.4 18.4 9.6 13.2 10.8 12 16 10.8 10.8 5.6 9.6 10.8 8.4 12 3.2Z"
        stroke="currentColor"
        strokeWidth={active ? 1.7 : 1.45}
        strokeLinejoin="round"
      />
      <path
        d="M18.2 14.2 18.8 16.4 21 17 18.8 17.6 18.2 19.8 17.6 17.6 15.4 17 17.6 16.4 18.2 14.2Z"
        stroke="currentColor"
        strokeWidth={active ? 1.5 : 1.3}
        strokeLinejoin="round"
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
  search: IconSearch,
  advisor: IconLarissa,
  account: IconAccount,
} as const;

export function PrimaryBottomNav() {
  const pathname = usePathname();
  const { customer } = useCustomerAuth();
  const { immersive } = useCheckoutUI();
  const { t } = useLocale();

  if (pathname.startsWith("/admin")) return null;
  if (isAuthRoute(pathname)) return null;
  if (immersive) return null;

  const labels = {
    home: t.home,
    shop: t.shop,
    search: t.search,
    advisor: t.advisor,
    account: t.account,
  } as const;

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t.home}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 rounded-[22px] border border-[var(--plum)]/10 bg-[var(--ivory)]/90 px-1.5 py-2 shadow-[0_12px_40px_rgba(50,22,47,0.08)] backdrop-blur-xl">
        {bottomNavLinks.map((link) => {
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
          const Icon = icons[link.id] ?? IconHome;
          return (
            <li key={link.id}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl px-0.5 py-2 transition-all duration-200",
                  active
                    ? "bg-[var(--plum)]/8 text-[var(--plum)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]",
                )}
              >
                <Icon active={active} />
                <span className="text-[0.62rem] font-medium tracking-[0.04em]">
                  {labels[link.id]}
                </span>
                {active ? (
                  <span
                    className="absolute bottom-1 h-[2px] w-3 rounded-full bg-[#c4a574]/70"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
