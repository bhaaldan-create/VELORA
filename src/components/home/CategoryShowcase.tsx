"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

const cards = [
  {
    slug: "skincare",
    titleAr: "العناية بالبشرة",
    titleEn: "Skincare",
    image: "/brand/categories/skincare.png",
    position: "center center",
  },
  {
    slug: "makeup",
    titleAr: "المكياج",
    titleEn: "Makeup",
    image: "/brand/categories/makeup.png",
    position: "center center",
  },
] as const;

export function CategoryShowcase() {
  const { locale } = useLocale();
  const ar = locale !== "en";

  return (
    <section className="bg-[#faf8fc] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <Link
            href="/shop"
            className="shrink-0 text-[0.78rem] font-medium text-[#8a7a88] transition-opacity hover:text-[#32162f] hover:opacity-80"
          >
            {ar ? "عرض الكل" : "View all"}
          </Link>
          <h2 className="font-display text-[clamp(1.05rem,3.2vw,1.35rem)] font-bold text-[#32162f]">
            {ar ? "تسوق حسب الفئة" : "Shop by category"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4" dir="rtl">
          {cards.map((card, i) => (
            <Link
              key={card.slug}
              href={`/shop?category=${card.slug}`}
              className={cn(
                "group relative aspect-[3/4] overflow-hidden rounded-[20px] sm:rounded-[22px]",
                "shadow-[0_10px_32px_rgba(50,22,47,0.07)]",
              )}
            >
              <Image
                src={card.image}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                style={{ objectPosition: card.position }}
                sizes="(max-width: 640px) 50vw, 360px"
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.35)] via-transparent to-transparent" />
              <div
                className="absolute inset-x-0 top-0 flex flex-col items-end gap-2 p-4 sm:gap-2.5 sm:p-5"
                dir={ar ? "rtl" : "ltr"}
              >
                <h3 className="text-[0.92rem] font-bold leading-tight text-[#32162f] sm:text-[1rem]">
                  {ar ? card.titleAr : card.titleEn}
                </h3>
                <span className="rounded-full bg-white px-3.5 py-1.5 text-[0.68rem] font-medium text-[#32162f] shadow-[0_4px_14px_rgba(50,22,47,0.1)] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95">
                  {ar ? "استكشفي" : "Explore"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
