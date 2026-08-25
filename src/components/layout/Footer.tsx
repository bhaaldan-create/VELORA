"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  IconInstagram,
  IconMail,
  IconTikTok,
  IconWhatsApp,
} from "@/components/contact/SocialIcons";
import { brand } from "@/constants/brand";
import { useLocale } from "@/context/LocaleContext";
import {
  getDefaultWhatsAppUrl,
  getInstagramUrl,
} from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { isAuthRoute } from "@/components/auth/auth-utils";

const TIKTOK_URL = "https://www.tiktok.com/@velorabeautyiraq";
const EMAIL = "care@velora.beauty";

const QUICK_LINKS = [
  { href: "/", labelKey: "home" as const },
  { href: "/shop", labelKey: "shop" as const },
  { href: "/shop?category=skincare", labelKey: "navSkin" as const },
  { href: "/shop?category=hair-care", labelKey: "navHair" as const },
  { href: "/shop?category=makeup", labelKey: "navMakeup" as const },
  { href: "/shop?category=body-care", labelKey: "navBody" as const },
];

const SERVICES = [
  {
    icon: Headphones,
    ar: "خدمة عملاء 24/7",
    en: "24/7 client care",
  },
  {
    icon: BadgeCheck,
    ar: "منتجات أصلية 100%",
    en: "100% authentic",
  },
  {
    icon: Truck,
    ar: "شحن سريع لكل العراق",
    en: "Fast shipping across Iraq",
  },
  {
    icon: ShieldCheck,
    ar: "دفع آمن 100%",
    en: "100% secure payment",
  },
] as const;

function SocialCircle({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "footer-social-btn inline-flex h-10 w-10 items-center justify-center rounded-full",
        "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]",
        "active:scale-[0.96]",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (isAuthRoute(pathname)) return null;

  const { t, locale } = useLocale();
  const ar = locale !== "en";
  const waUrl = getDefaultWhatsAppUrl(ar ? "ar" : "en");
  const igUrl = getInstagramUrl();
  const year = new Date().getFullYear();

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className={cn(
        "velora-footer relative mt-auto overflow-hidden",
        "border-t border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,color-mix(in_srgb,var(--plum)_10%,transparent),transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-7 pt-8 sm:px-8 sm:pb-9 sm:pt-10">
        {/* Brand + social */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center"
            aria-label="VELORA — Beauty Revealed"
          >
            <Image
              src="/brand/velora-logo-dark.png"
              alt="VELORA Beauty Revealed"
              width={148}
              height={56}
              className="logo-mark-light h-auto w-[118px] transition-opacity duration-300 group-hover:opacity-85 sm:w-[148px]"
            />
            <Image
              src="/brand/velora-logo-clear.png"
              alt=""
              aria-hidden
              width={148}
              height={56}
              className="logo-mark-dark absolute inset-0 m-auto h-auto w-[118px] transition-opacity duration-300 group-hover:opacity-85 sm:w-[148px]"
            />
          </Link>
          <p className="mt-2.5 max-w-md text-[0.8rem] leading-relaxed text-[var(--text-secondary)] sm:text-[0.85rem]">
            {ar ? brand.descriptionAr : brand.description}
          </p>

          <div className="mt-4">
            <p className="text-[0.65rem] font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase">
              {ar ? "تابعينا" : "Follow us"}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 lg:justify-start">
              <SocialCircle href={igUrl} label="Instagram @velorabeautyiraq">
                <IconInstagram size={15} />
              </SocialCircle>
              <SocialCircle href={TIKTOK_URL} label="TikTok @velorabeautyiraq">
                <IconTikTok size={14} />
              </SocialCircle>
              {waUrl ? (
                <SocialCircle
                  href={waUrl}
                  label={ar ? "WhatsApp" : "WhatsApp"}
                  className="text-[#5f8f72] hover:text-[#4a7a5e]"
                >
                  <IconWhatsApp size={15} />
                </SocialCircle>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick links — compact 2-col on mobile */}
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <p className="text-center text-[0.65rem] font-medium tracking-[0.18em] text-[var(--text-muted)] uppercase lg:text-start">
            {ar ? "روابط سريعة" : "Quick links"}
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-x-6 lg:gap-y-1.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="footer-link group relative inline-block text-[0.84rem] text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
                >
                  {t[link.labelKey]}
                  <span
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-start scale-x-0 bg-[var(--plum)]/40 transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Compact contact cards */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2 sm:gap-2.5">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5",
                "transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
              )}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--plum)_8%,transparent)] text-[#5f8f72] transition-transform duration-300 group-hover:scale-[1.04]">
                <IconWhatsApp size={14} />
              </span>
              <span className="min-w-0 text-start">
                <span className="block text-[0.8rem] font-medium text-[var(--text-primary)]">
                  {ar ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                </span>
                <span className="mt-0.5 block text-[0.68rem] text-[var(--text-muted)]">
                  {ar ? "نحن هنا لمساعدتك" : "We’re here to help"}
                </span>
              </span>
            </a>
          ) : null}

          <a
            href={`mailto:${EMAIL}`}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5",
              "transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
            )}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--plum)_8%,transparent)] text-[var(--icon-accent)] transition-transform duration-300 group-hover:scale-[1.04]">
              <IconMail size={14} />
            </span>
            <span className="min-w-0 text-start">
              <span className="block text-[0.8rem] font-medium text-[var(--text-primary)]">
                {ar ? "تواصل عبر البريد الإلكتروني" : "Email us"}
              </span>
              <span className="mt-0.5 block font-latin text-[0.68rem] tracking-[0.02em] text-[var(--text-muted)]" dir="ltr">
                {EMAIL}
              </span>
            </span>
          </a>
        </div>

        {/* Premium service strip */}
        <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]">
          <ul className="grid grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-4">
            {SERVICES.map(({ icon: Icon, ar: labelAr, en: labelEn }) => (
              <li
                key={labelEn}
                className="flex items-center gap-1.5 bg-[var(--bg-elevated)] px-2.5 py-2 sm:justify-center sm:px-2"
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0 text-[var(--icon-accent)]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-[0.65rem] leading-snug text-[var(--text-secondary)] sm:text-[0.68rem]">
                  {ar ? labelAr : labelEn}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="mt-5 flex flex-col items-center gap-1.5 border-t border-[var(--border)] pt-4 text-center sm:flex-row sm:justify-between sm:text-start">
          <p className="text-[0.65rem] tracking-[0.04em] text-[var(--text-muted)]">
            © {year} {brand.name} — {t.rights}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-[0.65rem] text-[var(--text-muted)]">
            <Link
              href="/privacy"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              {ar ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <span aria-hidden className="opacity-40">
              |
            </span>
            <Link
              href="/terms"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              {ar ? "الشروط والأحكام" : "Terms & Conditions"}
            </Link>
          </p>
        </div>
      </div>

      {/* Back to top — above mobile bottom nav */}
      <button
        type="button"
        onClick={scrollTop}
        aria-label={ar ? "العودة للأعلى" : "Back to top"}
        className={cn(
          "footer-back-top fixed z-30 inline-flex h-9 w-9 items-center justify-center rounded-full",
          "border border-[var(--border-strong)] bg-[var(--bg-glass-strong)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] backdrop-blur-md",
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:scale-95",
          "start-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:start-auto lg:end-6 lg:bottom-8",
        )}
      >
        <span className="text-[0.85rem] leading-none" aria-hidden>
          ↑
        </span>
      </button>
    </footer>
  );
}
