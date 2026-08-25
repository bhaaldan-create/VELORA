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
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.5h-3.6V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShop({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 8Z"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
        strokeLinejoin="round"
      />
      <path
        d="M8 8V6.5A4 4 0 0 1 12 2.5 4 4 0 0 1 16 6.5V8"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
      />
      <path
        d="M16.2 16.2 21 21"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLarissa({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 3.2 13.2 8.4 18.4 9.6 13.2 10.8 12 16 10.8 10.8 5.6 9.6 10.8 8.4 12 3.2Z"
        stroke="currentColor"
        strokeWidth={active ? 1.65 : 1.45}
        strokeLinejoin="round"
      />
      <path
        d="M18.2 14.2 18.8 16.4 21 17 18.8 17.6 18.2 19.8 17.6 17.6 15.4 17 17.6 16.4 18.2 14.2Z"
        stroke="currentColor"
        strokeWidth={active ? 1.45 : 1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAccount({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
      />
      <path
        d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth={active ? 1.75 : 1.5}
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
      className="fixed inset-x-3 z-50 lg:hidden"
      style={{
        bottom: "max(0.55rem, env(safe-area-inset-bottom))",
        // طبقة GPU ثابتة — يمنع اختفاء SVG مع التمرير / WebView
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
      aria-label={t.home}
    >
      <ul
        className={cn(
          "mx-auto grid max-w-md grid-cols-5 gap-0.5 rounded-[24px] px-1.5 py-1.5",
          "surface-glass border border-[var(--border-glass)] backdrop-blur-xl theme-shadow-md",
          "ring-1 ring-[var(--plum)]/[0.06]",
        )}
      >
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
                prefetch
                className={cn(
                  "relative flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1.5",
                  "transition-colors duration-200",
                  active
                    ? "bg-[var(--plum)]/[0.09] text-[var(--plum)]"
                    : "text-[var(--ink)]/55 hover:text-[var(--ink)]",
                )}
              >
                <Icon active={active} />
                <span className="text-[0.55rem] font-medium tracking-[0.02em]">
                  {labels[link.id]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
