"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { ProductScrollRail } from "@/components/shop/ProductScrollRail";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  titleEn: string;
  subtitle?: string;
  subtitleEn?: string;
  /** When set, shows brand logo instead of text title. */
  logoSrc?: string;
  /** Max height in px for the logo wordmark (optical calibration). */
  logoHeight?: number;
  /** Max width in px — keeps wide logos from dominating the header. */
  logoMaxWidth?: number;
  products: Product[];
  href?: string;
  tone?: "ivory" | "mist" | "white";
  className?: string;
};

export function ProductRail({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  logoSrc,
  logoHeight = 36,
  logoMaxWidth = 160,
  products,
  href,
  tone = "ivory",
  className,
}: Props) {
  const { locale, t } = useLocale();
  if (!products.length) return null;

  const bg =
    tone === "mist"
      ? "bg-[var(--mist)]"
      : tone === "white"
        ? "bg-[var(--bg-elevated)]"
        : "bg-[var(--background)]";

  const label = locale === "en" ? titleEn : title;

  return (
    <section className={cn(bg, "overflow-x-clip py-16 sm:py-20 lg:py-24", className)}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6 sm:gap-6">
          <div className="min-w-0 flex-1">
            {logoSrc ? (
              <h2 className="m-0 flex min-h-[2.5rem] items-center">
                <span className="sr-only">{label}</span>
                {/* Native img: black wordmarks invert under dark theme for mobile contrast */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt={label}
                  width={logoMaxWidth}
                  height={logoHeight}
                  className="brand-rail-logo block h-auto w-auto max-w-full object-contain"
                  style={{
                    maxHeight: logoHeight,
                    maxWidth: `min(100%, ${logoMaxWidth}px)`,
                    height: logoHeight,
                    width: "auto",
                  }}
                  decoding="async"
                />
              </h2>
            ) : (
              <h2 className="font-display text-[clamp(1.65rem,3.4vw,2.2rem)] font-bold tracking-tight text-[var(--plum)]">
                {label}
              </h2>
            )}
            {subtitle || subtitleEn ? (
              <p className="mt-2 text-[0.95rem] text-[var(--ink)]/60">
                {locale === "en" ? subtitleEn : subtitle}
              </p>
            ) : null}
          </div>
          {href ? (
            <Link
              href={href}
              className="shrink-0 self-end pb-1 text-[11px] font-medium tracking-[0.16em] text-[var(--plum)] uppercase transition-opacity hover:opacity-70"
            >
              {t.viewAll}
            </Link>
          ) : null}
        </div>
        <div className="min-w-0 overflow-hidden">
          <ProductScrollRail products={products} />
        </div>
      </div>
    </section>
  );
}
