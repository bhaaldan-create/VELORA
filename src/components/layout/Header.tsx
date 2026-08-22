"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { primaryNavLinks } from "@/constants/brand";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { customer, loading } = useCustomerAuth();
  const { t } = useLocale();

  const accountHref = customer ? "/account" : "/login";

  const labels: Record<(typeof primaryNavLinks)[number]["id"], string> = {
    home: t.home,
    shop: t.shop,
    advisor: t.advisor,
    account: t.account,
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--plum)]/8 bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:h-20 sm:px-8">
        <nav
          className="hidden items-center gap-5 xl:gap-7 lg:flex"
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
                    : "text-[var(--ink)]/75 hover:text-[var(--plum)]",
                )}
              >
                {labels[link.id]}
              </Link>
            );
          })}
        </nav>

        <div className="lg:hidden">
          <Logo priority size="sm" />
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
          <Logo priority size="sm" />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <Link
            href="/search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/70 transition-colors hover:bg-[var(--mist)] hover:text-[var(--plum)]"
            aria-label={t.search}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M16.2 16.2 21 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          {!customer && !loading ? (
            <Link
              href="/register"
              className="t2 hidden font-medium text-[var(--ink)]/70 transition-colors hover:text-[var(--plum)] md:inline lg:hidden"
            >
              {t.register}
            </Link>
          ) : null}
          <Link
            href="/cart"
            className="t2 relative font-medium text-[var(--ink)] transition-colors duration-300 hover:text-[var(--plum)]"
          >
            {t.bag}
            {itemCount > 0 ? (
              <span className="absolute -top-2 -start-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--btn-bg)] px-1 text-[10px] text-[var(--btn-fg)]">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
