"use client";

import { useLocale } from "@/context/LocaleContext";

const benefits = [
  {
    ar: "منتجات أصلية 100%",
    en: "100% authentic products",
    icon: (
      <path
        d="M12 3 4.5 6.5v5.2c0 4.4 3.1 7.7 7.5 8.8 4.4-1.1 7.5-4.4 7.5-8.8V6.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    ar: "براندات عالمية",
    en: "Global brands",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path
          d="M4 12h16M12 4c2.2 2.4 3.3 5 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5-3.3-8s1.1-5.6 3.3-8Z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
        />
      </>
    ),
  },
  {
    ar: "دفع آمن ومرن",
    en: "Secure & flexible payment",
    icon: (
      <path
        d="M3.5 8.5h17v8a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 16.5v-8Zm0 0V7A1.5 1.5 0 0 1 5 5.5h14A1.5 1.5 0 0 1 20.5 7v1.5M7 14.5h4"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  {
    ar: "توصيل داخل العراق",
    en: "Delivery across Iraq",
    icon: (
      <path
        d="M3 7.5h11v8H3v-8Zm11 2h4.2L21 12.8v2.7h-1.2a1.8 1.8 0 1 1-3.5 0H14v-5.9ZM6.2 18a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
] as const;

export function TrustBenefits() {
  const { locale } = useLocale();

  return (
    <section className="border-y border-[var(--plum)]/8 bg-[var(--surface)] py-14 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-6">
        {benefits.map((item) => (
          <div key={item.en} className="flex flex-col items-start gap-4 sm:items-center sm:text-center lg:items-start lg:text-start">
            <span className="text-[var(--plum)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                {item.icon}
              </svg>
            </span>
            <p className="text-[0.95rem] font-medium tracking-tight text-[var(--ink)]/85">
              {locale === "en" ? item.en : item.ar}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
