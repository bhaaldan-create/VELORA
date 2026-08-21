"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { primaryNavLinks, ui } from "@/constants/brand";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { customer, loading } = useCustomerAuth();

  const accountHref = customer ? "/account" : "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--plum)]/8 bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:h-20 sm:px-8">
        {/* العلامات الأربع — سطح المكتب */}
        <nav
          className="hidden items-center gap-5 xl:gap-7 lg:flex"
          aria-label="التنقل الرئيسي"
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
                {link.labelAr}
              </Link>
            );
          })}
        </nav>

        {/* موبايل: الشعار يسار منطقي / يمين بصري مع الحقيبة */}
        <div className="lg:hidden">
          <Logo priority size="sm" />
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
          <Logo priority size="sm" />
        </div>

        {/* الحقيبة تبقى كما هي — دون دمجها مع العلامات الأربع */}
        <div className="flex items-center gap-3 sm:gap-5">
          {!customer && !loading ? (
            <Link
              href="/register"
              className="t2 hidden font-medium text-[var(--ink)]/70 transition-colors hover:text-[var(--plum)] md:inline lg:hidden"
            >
              {ui.register}
            </Link>
          ) : null}
          <Link
            href="/cart"
            className="t2 relative font-medium text-[var(--ink)] transition-colors duration-300 hover:text-[var(--plum)]"
          >
            {ui.bag}
            {itemCount > 0 ? (
              <span className="absolute -top-2 -start-3 flex h-4 min-w-4 items-center justify-center bg-[var(--btn-bg)] px-1 text-[10px] text-[var(--btn-fg)]">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
