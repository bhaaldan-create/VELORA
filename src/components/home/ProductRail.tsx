"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { ProductSwiper } from "@/components/home/ProductSwiper";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
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
        ? "bg-[var(--surface)]"
        : "bg-[var(--ivory)]";

  return (
    <section className={cn(bg, "py-16 sm:py-20 lg:py-24", className)}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 flex items-end justify-between gap-6 sm:mb-12">
          <div className="max-w-xl">
            <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-[var(--plum)]">
              {locale === "en" ? titleEn : title}
            </h2>
            <p className="mt-2 text-[0.95rem] text-[var(--ink)]/60">
              {locale === "en" ? subtitleEn : subtitle}
            </p>
          </div>
          {href ? (
            <Link
              href={href}
              className="shrink-0 text-[11px] font-medium tracking-[0.16em] text-[var(--plum)] uppercase transition-opacity hover:opacity-70"
            >
              {t.viewAll}
            </Link>
          ) : null}
        </div>
        <ProductSwiper products={products} />
      </div>
    </section>
  );
}
