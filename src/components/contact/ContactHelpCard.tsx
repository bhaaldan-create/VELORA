"use client";

import { IconInstagram, IconWhatsApp } from "@/components/contact/SocialIcons";
import { useLocale } from "@/context/LocaleContext";
import {
  getDefaultWhatsAppUrl,
  getInstagramUrl,
  socialLinks,
} from "@/lib/social-links";

/** بطاقة تواصل تحريرية — الصفحة الرئيسية */
export function ContactHelpCard() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const waUrl = getDefaultWhatsAppUrl(ar ? "ar" : "en");
  const igUrl = getInstagramUrl();

  return (
    <section className="relative overflow-hidden border-y border-[var(--plum)]/8 bg-[var(--ivory)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 0% 50%, rgba(212,196,224,0.45), transparent 55%), radial-gradient(ellipse 50% 60% at 100% 20%, rgba(237,228,242,0.7), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="font-brand text-[0.95rem] tracking-[0.28em] text-[var(--plum)]">
          VELORA
        </p>
        <h2 className="font-display mt-3 max-w-xl text-[1.75rem] font-semibold text-[var(--plum)] sm:text-[2.1rem]">
          {ar ? "تحتاجين مساعدة؟" : "Need a hand?"}
        </h2>
        <p className="mt-3 max-w-lg text-[1rem] text-[var(--muted)]">
          {ar
            ? "فريق VELORA هنا من أجلكِ."
            : "The VELORA team is here for you."}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[22px] border border-[var(--plum)]/10 bg-white/80 p-6 transition-all duration-300 hover:border-[var(--plum)]/25 hover:shadow-[0_16px_40px_rgba(58,24,54,0.06)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mist)] text-[#3d8b6e]">
                <IconWhatsApp size={20} />
              </span>
              <p className="mt-5 text-[0.75rem] tracking-[0.14em] text-[var(--muted)] uppercase">
                {ar ? "للطلبات والاستفسارات" : "Orders & enquiries"}
              </p>
              <p className="mt-2 font-display text-[1.2rem] font-semibold text-[var(--plum)]">
                {ar ? "تواصلي معنا عبر WhatsApp" : "Message us on WhatsApp"}
              </p>
              <p className="mt-2 text-[0.85rem] text-[var(--muted)] transition-colors group-hover:text-[var(--plum)]">
                {ar ? "ردّ سريع وشخصي" : "A quick, personal reply"}
              </p>
            </a>
          ) : null}

          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[22px] border border-[var(--plum)]/10 bg-white/80 p-6 transition-all duration-300 hover:border-[var(--plum)]/25 hover:shadow-[0_16px_40px_rgba(58,24,54,0.06)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--plum)]">
              <IconInstagram size={19} />
            </span>
            <p className="mt-5 text-[0.75rem] tracking-[0.14em] text-[var(--muted)] uppercase">
              {ar ? "لمتابعة جديد VELORA" : "Stay with VELORA"}
            </p>
            <p className="mt-2 font-display text-[1.2rem] font-semibold text-[var(--plum)]">
              {ar ? "تابعينا على Instagram" : "Follow us on Instagram"}
            </p>
            <p
              className="mt-2 font-latin text-[0.9rem] tracking-[0.04em] text-[var(--plum)]/75"
              dir="ltr"
            >
              {socialLinks.instagram.handle}
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
