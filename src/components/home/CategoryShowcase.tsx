"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
import type { HomeCategoryCard } from "@/lib/home/types";
import { cn } from "@/lib/utils";

export function CategoryShowcase({ cards }: { cards: HomeCategoryCard[] }) {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const list = cards.filter((c) => c.enabled && c.imageUrl?.trim()).slice(0, 4);
  const visible = list.length ? list : [];

  if (!visible.length) return null;

  return (
    <section className="bg-[var(--background)] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <Link
            href="/shop"
            className="shrink-0 text-[0.78rem] font-medium text-[var(--muted)] transition-opacity hover:text-[var(--plum)] hover:opacity-80"
          >
            {ar ? "عرض الكل" : "View all"}
          </Link>
          <h2 className="font-display text-[clamp(1.05rem,3.2vw,1.35rem)] font-black text-[var(--plum)]">
            {ar ? "تسوق حسب الفئة" : "Shop by category"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4" dir="rtl">
          {visible.map((card, i) => {
            const href =
              card.href ||
              (card.slug ? `/shop?category=${card.slug}` : "/shop");
            const isData = shouldUseNativeImageElement(card.imageUrl);
            return (
              <Link
                key={card.id}
                href={href}
                className={cn(
                  "group relative aspect-[3/4] overflow-hidden rounded-[20px] sm:rounded-[22px]",
                  "shadow-[var(--shadow-md)] ring-1 ring-[var(--border)]",
                )}
              >
                {isData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    style={{
                      objectPosition: card.objectPosition || "center center",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0";
                      if (process.env.NODE_ENV === "development") {
                        console.warn("[CategoryShowcase] image failed", card.id, card.imageUrl);
                      }
                    }}
                  />
                ) : (
                  <Image
                    src={card.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    style={{
                      objectPosition: card.objectPosition || "center center",
                    }}
                    sizes="(max-width: 640px) 50vw, 360px"
                    priority={i === 0}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
                <div
                  className="absolute inset-x-0 top-0 flex flex-col items-end gap-2 p-4 sm:gap-2.5 sm:p-5"
                  dir={ar ? "rtl" : "ltr"}
                >
                  <h3 className="text-[0.92rem] font-bold leading-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:text-[1rem]">
                    {ar ? card.titleAr : card.titleEn}
                  </h3>
                  <span className="rounded-full bg-[var(--ivory-fixed)] px-3.5 py-1.5 text-[0.68rem] font-medium text-[var(--ink-deep)] shadow-[var(--shadow-sm)] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95">
                    {ar ? card.ctaAr : card.ctaEn}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
