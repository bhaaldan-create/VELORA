"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PaymentMethodsRow } from "@/components/payments/PaymentMethods";
import { brand, navLinks } from "@/constants/brand";
import { useLocale } from "@/context/LocaleContext";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_FEE_IQD, WASEET_CARRIER } from "@/lib/shipping";

export function Footer() {
  const { t, locale } = useLocale();

  const navLabels: Record<string, string> = {
    "/": t.home,
    "/shop": t.shop,
    "/shop?category=skincare": t.navSkin,
    "/shop?category=body-care": t.navBody,
    "/shop?category=hair-care": t.navHair,
    "/shop?category=makeup": t.navMakeup,
    "/advisor": t.advisor,
  };

  return (
    <footer className="mt-auto border-t border-[var(--plum)]/10 bg-[var(--ink-deep)] text-[var(--ivory-fixed)]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo size="md" light />
          <p className="t3 mt-6 max-w-sm text-[var(--ivory-fixed)]/70">
            {locale === "en" ? brand.description : brand.descriptionAr}
          </p>
          <p className="t1 mt-3 tracking-[0.28em] text-[#d4b5b8] uppercase">
            {brand.tagline}
          </p>
        </div>

        <div>
          <h3 className="t1 font-medium tracking-[0.18em] text-[#d4b5b8]">
            {t.explore}
          </h3>
          <ul className="mt-5 space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="t3 text-[var(--ivory-fixed)]/75 transition-colors hover:text-[var(--ivory-fixed)]"
                >
                  {navLabels[link.href] ?? link.labelAr}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/about"
                className="t3 text-[var(--ivory-fixed)]/75 transition-colors hover:text-[var(--ivory-fixed)]"
              >
                {t.about}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="t1 font-medium tracking-[0.18em] text-[#d4b5b8]">
            {t.clientCare}
          </h3>
          <ul className="mt-5 space-y-3 t3 text-[var(--ivory-fixed)]/75">
            <li>
              <Link href="/login" className="hover:text-[var(--ivory-fixed)]">
                {t.login}
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-[var(--ivory-fixed)]">
                {t.register}
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-[var(--ivory-fixed)]">
                {t.account}
              </Link>
            </li>
            <li>
              <Link href="/advisor" className="hover:text-[var(--ivory-fixed)]">
                {t.advisor}
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-[var(--ivory-fixed)]">
                {t.bag}
              </Link>
            </li>
            <li>
              <a
                href="mailto:care@velora.beauty"
                className="hover:text-[var(--ivory-fixed)]"
                dir="ltr"
              >
                care@velora.beauty
              </a>
            </li>
            <li>
              {t.deliveryVia}{" "}
              {locale === "en" ? WASEET_CARRIER.nameEn : WASEET_CARRIER.nameAr} —{" "}
              {formatPrice(DELIVERY_FEE_IQD)}
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-white/10 px-5 py-8 sm:px-8">
        <PaymentMethodsRow dark title={t.paymentMethods} />
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center t1 tracking-[0.1em] text-[var(--ivory-fixed)]/45 sm:px-8">
        © {new Date().getFullYear()} {brand.name} · {t.rights}
      </div>
    </footer>
  );
}
