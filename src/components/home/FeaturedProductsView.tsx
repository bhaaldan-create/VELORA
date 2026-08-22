"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/context/LocaleContext";

export function FeaturedProductsView({ children }: { children: ReactNode }) {
  const { t } = useLocale();

  return (
    <section className="bg-[var(--mist)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
              {t.theEdit}
            </p>
            <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
              {t.featuredTitle}
            </h2>
          </div>
          <Link href="/shop">
            <Button variant="ghost">{t.viewAll}</Button>
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}
