"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

const categories = [
  {
    slug: "skincare",
    titleAr: "العناية بالبشرة",
    titleEn: "Skincare",
    tone: "linear-gradient(160deg, #EDE4E0 0%, #C9B2B6 55%, #5C3A5E 120%)",
  },
  {
    slug: "makeup",
    titleAr: "المكياج",
    titleEn: "Makeup",
    tone: "linear-gradient(160deg, #F3E6E4 0%, #D4B5B8 50%, #6B4A42 120%)",
  },
  {
    slug: "hair-care",
    titleAr: "العناية بالشعر",
    titleEn: "Hair care",
    tone: "linear-gradient(160deg, #E9DFD6 0%, #BFA8A0 50%, #1A121C 120%)",
  },
  {
    slug: "body-care",
    titleAr: "العناية بالجسم",
    titleEn: "Body care",
    tone: "linear-gradient(160deg, #F1EAE6 0%, #D8C4B8 50%, #8B5E4B 120%)",
  },
] as const;

export function ShopByCategory() {
  const { locale, t } = useLocale();

  return (
    <section className="bg-[var(--surface)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 max-w-xl sm:mb-12">
          <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--muted)] uppercase">
            {locale === "en" ? "Browse" : "تسوّقي حسب"}
          </p>
          <h2 className="font-display mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold text-[var(--plum)]">
            {locale === "en" ? "Shop by category" : "تسوقي حسب الفئة"}
          </h2>
        </div>

        {/* Mobile / tablet swipe; desktop grid */}
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className={cn(
                "group relative min-w-[68%] snap-start overflow-hidden sm:min-w-[42%] lg:min-w-0",
                "animate-[velora-rise_0.8s_ease-out_both]",
              )}
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <div
                className="aspect-[4/5] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                style={{ background: cat.tone }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-4 pb-5 pt-16">
                <h3 className="text-[1.05rem] font-medium text-white">
                  {locale === "en" ? cat.titleEn : cat.titleAr}
                </h3>
                <p className="mt-1 text-[10px] tracking-[0.16em] text-white/70 uppercase">
                  {t.explore}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
