"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { bottomNavLinks } from "@/constants/brand";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useCheckoutUI } from "@/context/CheckoutUIContext";
import { useLocale } from "@/context/LocaleContext";
import { useWishlist } from "@/context/WishlistContext";
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

function IconCart({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8.5h12l-1 10.5H7L6 8.5Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5V7a3 3 0 0 1 6 0v1.5"
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

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.35-7-9.1A3.85 3.85 0 0 1 12 7.2a3.85 3.85 0 0 1 7 3.7C19 15.65 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.5}
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
  cart: IconCart,
  search: IconSearch,
  wishlist: IconHeart,
  account: IconAccount,
} as const;

export function PrimaryBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { customer } = useCustomerAuth();
  const { immersive } = useCheckoutUI();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { t, locale } = useLocale();
  const ar = locale !== "en";
  const onWishlist =
    pathname.includes("wishlist") ||
    searchParams.get("section") === "wishlist";

  if (pathname.startsWith("/admin")) return null;
  if (isAuthRoute(pathname)) return null;
  if (immersive) return null;

  const labels = {
    home: t.home,
    cart: t.bag,
    search: ar ? "بحث" : "Search",
    wishlist: ar ? "المفضلة" : "Saved",
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
              : link.id === "wishlist"
                ? customer
                  ? "/account?section=wishlist"
                  : "/login?next=/account?section=wishlist"
                : link.href;
          const active =
            link.id === "home"
              ? pathname === "/"
              : link.id === "wishlist"
                ? onWishlist
                : link.id === "account"
                  ? pathname.startsWith("/account") && !onWishlist
                  : pathname.startsWith(link.href);
          const Icon = icons[link.id] ?? IconHome;
          const badge =
            link.id === "cart"
              ? itemCount
              : link.id === "wishlist"
                ? wishCount
                : 0;
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
                <span className="relative">
                  <Icon active={active} />
                  {badge > 0 ? (
                    <span className="absolute -end-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--plum)] px-0.5 text-[9px] text-[var(--btn-fg)]">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
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
