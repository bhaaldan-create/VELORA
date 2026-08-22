"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

type CategoryItem = {
  slug: string;
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  tone: string;
};

export function CategoryStripView({
  categories,
}: {
  categories: CategoryItem[];
}) {
  const { t, locale } = useLocale();

  return (
    <section className="bg-[var(--ivory)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            {t.theHouse}
          </p>
          <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
            {t.pillarsTitle}
          </h2>
          <p className="t4 mt-4 text-[var(--ink)]/70">{t.pillarsSub}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group block animate-[velora-rise_0.9s_ease-out_both]"
              style={{ animationDelay: `${0.08 * i}s` }}
            >
              <div
                className="aspect-[4/5] transition-transform duration-700 group-hover:scale-[1.02]"
                style={{ background: cat.tone }}
              />
              <h3 className="font-display t6 mt-5 font-medium text-[var(--plum)]">
                {locale === "en" ? cat.name : cat.nameAr}
              </h3>
              <p className="t3 mt-2 text-[var(--muted)]">
                {locale === "en" ? cat.tagline : cat.taglineAr}
              </p>
              {locale === "ar" ? (
                <p
                  className="t1 mt-1 tracking-[0.12em] text-[var(--muted)]/70 uppercase"
                  dir="ltr"
                >
                  {cat.name}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
