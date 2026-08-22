"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/context/LocaleContext";

const miniCards = [
  {
    href: "/shop?category=skincare",
    ar: "روتين البشرة",
    en: "Skin ritual",
  },
  {
    href: "/shop?category=makeup",
    ar: "إطلالة يومية",
    en: "Everyday look",
  },
  {
    href: "/shop?category=body-care",
    ar: "اختاري عطرك",
    en: "Find your scent",
  },
] as const;

export function EditorialBeauty() {
  const { locale } = useLocale();

  return (
    <section className="bg-[var(--ivory)] py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-[560px]">
            <Image
              src="/brand/hero-desktop.png"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/5 lg:to-black/35" />
          </div>

          <div className="flex flex-col justify-center bg-[var(--champagne)]/50 px-6 py-12 sm:px-10 lg:px-12">
            <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--muted)] uppercase">
              {locale === "en" ? "Editorial" : "افتتاحية الجمال"}
            </p>
            <h2 className="font-display mt-4 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight text-[var(--plum)]">
              {locale === "en" ? "The radiance ritual" : "طقس الإشراقة"}
            </h2>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-[var(--ink)]/65">
              {locale === "en"
                ? "A quiet sequence of cleanse, treat, and seal — chosen to reveal luminous skin without noise."
                : "تسلسل هادئ من التنظيف والعناية والإغلاق — مختار ليُظهر بشرة مضيئة بلا ضجيج."}
            </p>
            <div className="mt-8">
              <Link href="/shop?category=skincare">
                <Button>
                  {locale === "en" ? "Discover the ritual" : "اكتشفي الروتين"}
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {miniCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="border border-[var(--plum)]/10 bg-[var(--ivory)]/70 px-3 py-4 text-center transition-colors duration-300 hover:border-[var(--plum)]/25 hover:bg-[var(--ivory)]"
                >
                  <span className="text-[0.8rem] font-medium text-[var(--plum)]">
                    {locale === "en" ? card.en : card.ar}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
