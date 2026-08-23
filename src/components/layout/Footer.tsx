"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { IconInstagram, IconWhatsApp } from "@/components/contact/SocialIcons";
import { PaymentMethodsRow } from "@/components/payments/PaymentMethods";
import { brand, navLinks } from "@/constants/brand";
import { useLocale } from "@/context/LocaleContext";
import {
  getDefaultWhatsAppUrl,
  getInstagramUrl,
  socialLinks,
} from "@/lib/social-links";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_FEE_IQD, WASEET_CARRIER } from "@/lib/shipping";
import { isAuthRoute } from "@/components/auth/auth-utils";

export function Footer() {
  const pathname = usePathname();
  if (isAuthRoute(pathname)) return null;
  const { t, locale } = useLocale();
  const ar = locale !== "en";
  const waUrl = getDefaultWhatsAppUrl(ar ? "ar" : "en");
  const igUrl = getInstagramUrl();

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

      {/* Editorial stay-in-touch — ليس شريط أيقونات تقليدي */}
      <div className="mx-auto max-w-7xl border-t border-white/10 px-5 py-12 sm:px-8">
        <div className="max-w-2xl">
          <h3 className="font-display text-[1.35rem] font-semibold text-[var(--ivory-fixed)] sm:text-[1.5rem]">
            {ar
              ? "ابقي على تواصل مع VELORA"
              : "Stay close to VELORA"}
          </h3>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ivory-fixed)]/65">
            {ar
              ? "تابعي جديدنا، اكتشفي أحدث المنتجات، أو تواصلي معنا مباشرة."
              : "Follow what’s new, discover the latest pieces, or reach us directly."}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-4 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            aria-label={`Instagram ${socialLinks.instagram.handle}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--ivory-fixed)]">
              <IconInstagram size={18} />
            </span>
            <span className="min-w-0 text-start">
              <span className="block text-[0.7rem] tracking-[0.16em] text-[#d4b5b8] uppercase">
                Instagram
              </span>
              <span
                className="mt-1 block font-latin text-[0.95rem] tracking-[0.03em] text-[var(--ivory-fixed)]"
                dir="ltr"
              >
                {socialLinks.instagram.handle}
              </span>
            </span>
          </a>

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-4 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
              aria-label={ar ? "تواصلي معنا عبر WhatsApp" : "Contact us on WhatsApp"}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#9fd4b8]">
                <IconWhatsApp size={18} />
              </span>
              <span className="min-w-0 text-start">
                <span className="block text-[0.7rem] tracking-[0.16em] text-[#d4b5b8] uppercase">
                  WhatsApp
                </span>
                <span className="mt-1 block text-[0.95rem] text-[var(--ivory-fixed)]">
                  {ar ? "تواصلي معنا" : "Message us"}
                </span>
              </span>
            </a>
          ) : null}
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
