"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
import type { HomePromoConfig } from "@/lib/home/types";

export function PromoBanner({ config }: { config: HomePromoConfig }) {
  const { locale } = useLocale();
  const ar = locale !== "en";

  if (!config.enabled) return null;

  const useNativeImg = shouldUseNativeImageElement(config.imageUrl);

  return (
    <section className="bg-[var(--background)] px-4 pb-8 sm:px-6 sm:pb-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[22px] sm:rounded-[24px] ring-1 ring-[var(--border)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #32162f 0%, #4a2a45 38%, #6b4a68 72%, #7d5f7a 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 10c5 10 14 15 14 26 0 10-6 18-14 18s-14-8-14-18c0-11 9-16 14-26z' fill='none' stroke='%23E8D5B5' stroke-width='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-[1] flex min-h-[168px] items-stretch sm:min-h-[200px]" dir="ltr">
          <div className="relative min-h-[168px] w-[42%] shrink-0 sm:min-h-[200px] sm:w-[38%] md:w-[36%]">
            {useNativeImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-left"
                style={{
                  objectPosition: config.objectPosition || "left center",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0";
                  if (process.env.NODE_ENV === "development") {
                    console.warn("[PromoBanner] image failed", config.imageUrl);
                  }
                }}
              />
            ) : (
              <Image
                src={config.imageUrl}
                alt=""
                fill
                className="object-cover object-left"
                style={{
                  objectPosition: config.objectPosition || "left center",
                }}
                sizes="(max-width: 640px) 42vw, 320px"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-[#32162f]/30 via-transparent to-transparent" />
          </div>

          <div
            className="flex flex-1 flex-col justify-center gap-3 px-4 py-6 sm:px-6 sm:py-8 md:px-8"
            dir={ar ? "rtl" : "ltr"}
          >
            <h2 className="font-display text-[clamp(1.25rem,4vw,1.75rem)] font-black leading-tight text-white">
              {ar ? config.headlineAr : config.headlineEn}
            </h2>
            <p className="font-display max-w-md text-[0.78rem] font-light leading-[1.7] text-white/85 sm:text-[0.85rem]">
              {ar ? config.bodyAr : config.bodyEn}
            </p>
            <div className="mt-1 flex justify-start">
              <Link
                href={config.href || "/shop"}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory-fixed)] px-5 py-2.5 text-[0.78rem] font-medium text-[var(--ink-deep)] shadow-[0_8px_22px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {ar ? config.ctaAr : config.ctaEn}
                <span aria-hidden className="text-[0.72rem]">
                  {ar ? "←" : "→"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
