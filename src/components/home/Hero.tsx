"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/context/LocaleContext";

export function Hero() {
  const { t, dir } = useLocale();

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#c9b8d4] text-white">
      <Image
        src="/brand/hero-mobile.png"
        alt=""
        fill
        priority
        className="object-cover object-[center_78%] md:hidden"
        sizes="100vw"
      />
      <Image
        src="/brand/hero-desktop.png"
        alt=""
        fill
        priority
        className="hidden object-cover object-[right_center] md:block"
        sizes="100vw"
      />

      <div
        className="absolute inset-0 animate-[velora-fade_1.4s_ease-out_both]"
        style={{
          background: `
            linear-gradient(90deg, rgba(22,14,32,0.58) 0%, rgba(22,14,32,0.32) 34%, rgba(22,14,32,0.1) 54%, transparent 70%),
            linear-gradient(180deg, rgba(20,12,28,0.2) 0%, transparent 40%, rgba(16,10,24,0.38) 100%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-end px-5 pb-24 pt-28 sm:px-8 sm:pb-28 lg:items-center lg:pb-32">
        <div
          className="mr-auto max-w-xl animate-[velora-rise_1s_ease-out_both]"
          dir={dir}
        >
          {/* Logo above headline — transparent mark + soft rectangular glow */}
          <div className="relative mb-2 inline-flex max-w-full items-center justify-center">
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[108%] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 45%, transparent 72%)",
                filter: "blur(10px)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/velora-logo-clear.png"
              alt="VELORA — Beauty Revealed"
              width={320}
              height={106}
              decoding="async"
              fetchPriority="high"
              className="relative z-[1] h-auto w-[min(78vw,300px)] select-none sm:w-[320px]"
              style={{
                filter:
                  "drop-shadow(0 2px 2px rgba(0,0,0,0.5)) drop-shadow(0 10px 24px rgba(0,0,0,0.35))",
              }}
            />
          </div>

          <h1 className="font-display mt-6 text-[clamp(1.75rem,4.4vw,2.85rem)] font-semibold leading-snug tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
            {t.heroHeadline}
          </h1>

          <p className="t4 mt-4 max-w-md leading-relaxed text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            {t.heroSub}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop">
              <Button className="bg-white text-[#2A1A2C] hover:bg-[#F1EAE6]">
                {t.heroCtaShop}
              </Button>
            </Link>
            <Link href="/advisor">
              <Button
                variant="outline"
                className="border-white/55 text-white hover:border-white/90 hover:bg-white/10"
              >
                {t.heroCtaAdvisor}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
