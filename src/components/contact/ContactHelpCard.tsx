"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Headphones, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { IconInstagram, IconWhatsApp } from "@/components/contact/SocialIcons";
import { useLocale } from "@/context/LocaleContext";
import {
  getDefaultWhatsAppUrl,
  getInstagramUrl,
  socialLinks,
} from "@/lib/social-links";
import { cn } from "@/lib/utils";

/** قسم تواصل فاخر — الصفحة الرئيسية */
export function ContactHelpCard() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const waUrl = getDefaultWhatsAppUrl(ar ? "ar" : "en");
  const igUrl = getInstagramUrl();

  const copy = ar
    ? {
        title: "تحتاجين مساعدة؟",
        subtitle: "فريق VELORA هنا من أجلك.",
        waEyebrow: "للطلبات والاستفسارات",
        waTitle: "تواصلي معنا عبر WhatsApp",
        waDesc: "رد سريع وشخصي لمساعدتك بكل حب.",
        igEyebrow: "لمتابعة جديد VELORA",
        igTitle: "تابعينا على Instagram",
        igDesc: "جمال، عروض، وإلهام يومي في انتظارك.",
        footer: "نحن هنا لنمنحك تجربة جمال استثنائية.",
        waAria: "تواصلي معنا عبر WhatsApp",
        igAria: "تابعينا على Instagram",
      }
    : {
        title: "Need a hand?",
        subtitle: "The VELORA team is here for you.",
        waEyebrow: "Orders & enquiries",
        waTitle: "Message us on WhatsApp",
        waDesc: "A quick, personal reply — with care.",
        igEyebrow: "Stay with VELORA",
        igTitle: "Follow us on Instagram",
        igDesc: "Beauty, offers, and daily inspiration.",
        footer: "We’re here for an exceptional beauty experience.",
        waAria: "Contact us on WhatsApp",
        igAria: "Follow us on Instagram",
      };

  return (
    <section
      className="relative overflow-hidden border-y border-[var(--border)]"
      aria-labelledby="velora-help-heading"
    >
      {/* Theme-aware atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--background)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 home-help-atmosphere"
        style={{
          background: [
            "radial-gradient(ellipse 75% 70% at 8% 20%, color-mix(in srgb, var(--blush) 28%, transparent), transparent 58%)",
            "radial-gradient(ellipse 55% 55% at 92% 78%, color-mix(in srgb, var(--account-orchid) 22%, transparent), transparent 52%)",
            "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--mist) 40%, transparent) 50%, transparent 100%)",
          ].join(", "),
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[var(--plum)]/55">
              <Headphones
                className="h-4 w-4 shrink-0"
                strokeWidth={1.6}
                aria-hidden
              />
              <span className="h-px w-8 bg-[var(--plum)]/20" aria-hidden />
              <Sparkles
                className="h-3.5 w-3.5 shrink-0 text-[var(--plum)]/40"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>

            <div className="mt-4 flex items-start gap-3">
              <h2
                id="velora-help-heading"
                className="font-display text-[clamp(1.75rem,4.2vw,2.55rem)] font-black leading-[1.2] tracking-[-0.02em] text-[var(--plum)]"
              >
                {copy.title}
              </h2>
              {/* Soft decorative sparkle */}
              <span
                className="mt-1.5 hidden sm:inline-flex"
                aria-hidden
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3.2 13.1 9.1 19 10.2 13.1 11.3 12 17.2 10.9 11.3 5 10.2 10.9 9.1 12 3.2Z"
                    fill="rgba(149,120,168,0.35)"
                  />
                  <path
                    d="M18.2 14.5 18.7 17 21.2 17.5 18.7 18 18.2 20.5 17.7 18 15.2 17.5 17.7 17 18.2 14.5Z"
                    fill="rgba(149,120,168,0.28)"
                  />
                </svg>
              </span>
            </div>

            <p className="font-display mt-3 max-w-lg text-[1.02rem] font-light leading-relaxed text-[var(--muted)] sm:text-[1.08rem]">
              {copy.subtitle}
            </p>
          </div>

          <Logo size="sm" className="opacity-90" />
        </div>

        {/* Contact cards */}
        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5">
          {waUrl ? (
            <HelpCard
              href={waUrl}
              ariaLabel={copy.waAria}
              eyebrow={copy.waEyebrow}
              title={copy.waTitle}
              description={copy.waDesc}
              icon={<IconWhatsApp size={16} />}
            />
          ) : null}

          <HelpCard
            href={igUrl}
            ariaLabel={copy.igAria}
            eyebrow={copy.igEyebrow}
            title={copy.igTitle}
            description={copy.igDesc}
            meta={
              <span
                className="mt-2.5 inline-block font-latin text-[0.84rem] tracking-[0.04em] text-[var(--plum)]/70"
                dir="ltr"
              >
                {socialLinks.instagram.handle}
              </span>
            }
            icon={<IconInstagram size={15} />}
          />
        </div>

        {/* Soft footer strip */}
        <div className="mt-10 flex items-center justify-center gap-2.5 sm:mt-12">
          <Sparkles
            className="h-3.5 w-3.5 text-[var(--plum)]/35"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-center text-[0.88rem] font-light tracking-[0.01em] text-[var(--plum)]/65 sm:text-[0.92rem]">
            {copy.footer}
          </p>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="text-[var(--plum)]/35"
          >
            <path
              d="M7.2 9.1h9.6l-.5 8.4a1.5 1.5 0 0 1-1.5 1.4H9.2a1.5 1.5 0 0 1-1.5-1.4L7.2 9.1Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M9.1 9.1V7.7a2.9 2.9 0 0 1 5.8 0v1.4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

function HelpCard({
  href,
  ariaLabel,
  eyebrow,
  title,
  description,
  meta,
  icon,
}: {
  href: string;
  ariaLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-5 lg:p-6",
        "border border-[var(--border-strong)]",
        "bg-[var(--bg-elevated)]",
        "shadow-[var(--shadow-md)]",
        "ring-1 ring-[var(--border)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        "hover:shadow-[var(--shadow-lg)]",
        "hover:ring-[var(--plum)]/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plum)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
      )}
    >
      {/* Soft purple glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -end-8 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(179,155,192,0.28),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <span
        className={cn(
          "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
          "bg-[linear-gradient(145deg,#c9b6d4_0%,#9578a8_55%,#6f557f_100%)]",
          "text-white",
          "shadow-[0_8px_18px_-10px_rgba(111,85,127,0.5),0_1px_0_rgba(255,255,255,0.35)_inset]",
          "ring-1 ring-white/40",
          "transition-transform duration-300 ease-out group-hover:scale-[1.05] group-hover:-rotate-2",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[2px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0)_55%)]"
        />
        <span className="relative">{icon}</span>
      </span>

      <div className="relative min-w-0 flex-1">
        <p className="text-[0.72rem] font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
          {eyebrow}
        </p>
        <p className="font-display mt-1.5 text-[1.15rem] font-bold leading-snug text-[var(--plum)] sm:text-[1.25rem]">
          {title}
        </p>
        <p className="mt-1.5 text-[0.88rem] font-light leading-relaxed text-[var(--muted)] sm:text-[0.92rem]">
          {description}
        </p>
        {meta}
      </div>

      <span
        className={cn(
          "relative ms-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--plum)]",
          "shadow-[var(--shadow-sm)]",
          "transition-all duration-300 ease-out",
          "group-hover:border-transparent group-hover:bg-[var(--btn-bg)] group-hover:text-[var(--btn-fg)]",
          "group-hover:-translate-x-1 rtl:group-hover:translate-x-1",
        )}
        aria-hidden
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-0" strokeWidth={1.8} />
      </span>
    </a>
  );
}
