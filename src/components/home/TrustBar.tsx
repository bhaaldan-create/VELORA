"use client";

import { useLocale } from "@/context/LocaleContext";

const items = [
  {
    titleAr: "أصالة مضمونة",
    titleEn: "Guaranteed authenticity",
    bodyAr: "منتجات أصلية 100%",
    bodyEn: "100% authentic products",
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
    titleAr: "عروض حصرية",
    titleEn: "Exclusive offers",
    bodyAr: "خصومات وتوفير دائم",
    bodyEn: "Ongoing savings & edits",
    icon: (
      <path
        d="M12 3.5l1.1 5.2L18 10l-4.9 1.3L12 16.5l-1.1-5.2L6 10l4.9-1.3L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    titleAr: "توصيل سريع",
    titleEn: "Fast delivery",
    bodyAr: "لكل أنحاء العراق",
    bodyEn: "Across all of Iraq",
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
  {
    titleAr: "دعم احترافي",
    titleEn: "Expert care",
    bodyAr: "خدمة عملاء متميزة",
    bodyEn: "Refined client support",
    icon: (
      <path
        d="M5 18.5l1.8-2.2A7.5 7.5 0 1 1 18.5 12v1.2A7.5 7.5 0 0 1 7.8 18L5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    ),
  },
] as const;

export function TrustBar() {
  const { locale } = useLocale();
  const ar = locale !== "en";

  return (
    <section className="border-b border-[var(--plum)]/8 bg-[color-mix(in_srgb,var(--ivory)_88%,white)]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex gap-0 overflow-x-auto py-5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:overflow-visible sm:py-7 [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <div
              key={item.titleEn}
              className="relative flex min-w-[72%] shrink-0 items-start gap-3 px-4 sm:min-w-0 sm:px-5"
            >
              {i > 0 ? (
                <span
                  className="absolute inset-y-2 start-0 hidden w-px bg-[var(--plum)]/10 sm:block"
                  aria-hidden
                />
              ) : null}
              <span className="mt-0.5 text-[var(--plum)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  {item.icon}
                </svg>
              </span>
              <div>
                <p className="text-[0.88rem] font-semibold text-[var(--plum)]">
                  {ar ? item.titleAr : item.titleEn}
                </p>
                <p className="mt-0.5 text-[0.78rem] text-[var(--muted)]">
                  {ar ? item.bodyAr : item.bodyEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
