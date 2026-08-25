"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { primaryNavLinks } from "@/constants/brand";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import { isAuthRoute } from "@/components/auth/auth-utils";

export function Header() {
  const pathname = usePathname();
  if (isAuthRoute(pathname)) return null;
  const router = useRouter();
  const { itemCount } = useCart();
  const { customer, loading } = useCustomerAuth();
  const { t, locale } = useLocale();
  const ar = locale !== "en";
  const { unreadCount, openPanel } = useNotifications();

  const accountHref = customer ? "/account" : "/login";

  const labels: Record<(typeof primaryNavLinks)[number]["id"], string> = {
    home: t.home,
    shop: t.shop,
    advisor: t.advisor,
    account: t.account,
  };

  function onBellClick() {
    if (!customer) {
      router.push("/login?next=/account/notifications");
      return;
    }
    openPanel();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-glass-strong)] backdrop-blur-md">
        <div className="relative mx-auto flex h-[3.85rem] max-w-7xl items-center justify-between gap-2 px-4 sm:h-20 sm:px-8">
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <Link
              href="/search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/70 transition-colors hover:bg-[var(--mist)] hover:text-[var(--plum)]"
              aria-label={t.search}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M16.2 16.2 21 21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <Logo priority size="sm" />
            <p className="mt-0.5 hidden text-[0.52rem] font-medium tracking-[0.28em] text-[var(--plum)]/45 sm:block">
              BEAUTY REVEALED
            </p>
            <span
              className="mx-auto mt-1 hidden h-px w-10 bg-[var(--plum)]/15 sm:block"
              aria-hidden
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav
              className="me-2 hidden items-center gap-4 xl:flex"
              aria-label={t.home}
            >
              {primaryNavLinks.map((link) => {
                const href =
                  link.id === "account"
                    ? loading
                      ? "/account"
                      : accountHref
                    : link.href;
                const active =
                  link.id === "home"
                    ? pathname === "/"
                    : link.id === "account"
                      ? pathname.startsWith("/account") ||
                        pathname.startsWith("/login") ||
                        pathname.startsWith("/register")
                      : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.id}
                    href={href}
                    className={cn(
                      "t2 font-medium transition-colors duration-300",
                      active
                        ? "text-[var(--plum)]"
                        : "text-[var(--ink)]/70 hover:text-[var(--plum)]",
                    )}
                  >
                    {labels[link.id]}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onBellClick}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/70 transition-colors hover:bg-[var(--mist)] hover:text-[var(--plum)]"
              aria-label={ar ? "الإشعارات" : "Notifications"}
              title={ar ? "الإشعارات" : "Notifications"}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.5 5.5 1.5 5.5H5s1.5-1.3 1.5-5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 18a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {customer && unreadCount > 0 ? (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--btn-bg)] px-1 text-[10px] text-[var(--btn-fg)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            <Link
              href="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/70 transition-colors hover:bg-[var(--mist)] hover:text-[var(--plum)]"
              aria-label={t.bag}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 8.5h12l-1 10.5H7L6 8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8.5V7a3 3 0 0 1 6 0v1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--btn-bg)] px-1 text-[10px] text-[var(--btn-fg)]">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>
      <NotificationPanel />
    </>
  );
}
