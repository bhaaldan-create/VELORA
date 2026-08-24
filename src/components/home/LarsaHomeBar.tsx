"use client";

import Link from "next/link";
import { LarsaMark } from "@/components/advisor/LarsaIcons";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

export function LarsaHomeBar() {
  const { locale } = useLocale();
  const ar = locale !== "en";

  return (
    <section
      className="relative overflow-hidden border-b border-[var(--plum)]/8 bg-[linear-gradient(128deg,color-mix(in_srgb,var(--mist)_55%,white)_0%,var(--ivory)_42%,color-mix(in_srgb,var(--plum)_5%,var(--ivory))_100%)]"
      aria-label={ar ? "لارسا" : "LARSA"}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 120% at 8% 50%, rgba(212,181,184,0.22), transparent 58%), radial-gradient(ellipse 50% 80% at 92% 30%, rgba(92,58,94,0.08), transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 start-0 w-px bg-[var(--plum)]/10"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:gap-5 sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/85 shadow-[0_6px_22px_rgba(50,22,47,0.07)] ring-1 ring-[var(--plum)]/10 sm:h-11 sm:w-11 sm:rounded-2xl"
          >
            <LarsaMark
              size={26}
              className="text-[var(--plum)] sm:hidden"
            />
            <LarsaMark
              size={30}
              className="hidden text-[var(--plum)] sm:block"
            />
          </span>

          <div className="min-w-0">
            <p
              className="font-latin text-[9px] font-medium tracking-[0.24em] text-[var(--plum)]/50 uppercase sm:text-[10px]"
            >
              LARSA
            </p>
            <p
              className="font-display text-[0.88rem] font-semibold leading-snug text-[var(--plum)] sm:text-[1.02rem]"
            >
              {ar ? "مستشارتكِ الذكية للجمال" : "Your intelligent beauty guide"}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[0.72rem] text-[var(--muted)] sm:text-[0.78rem]">
              {ar
                ? "روتين مخصص لبشرتكِ وشعركِ — في دقائق"
                : "A bespoke ritual for skin & hair — in minutes"}
            </p>
          </div>
        </div>

        <Link
          href="/advisor"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 sm:gap-2 sm:px-5 sm:py-2.5",
            "bg-[var(--plum)] text-[0.72rem] font-medium text-[var(--btn-fg)] sm:text-[0.8rem]",
            "shadow-[0_8px_22px_rgba(50,22,47,0.16)] transition-transform duration-200",
            "hover:scale-[1.02] active:scale-[0.98]",
          )}
        >
          <span className="whitespace-nowrap">
            {ar ? "استكشفي لارسا" : "Meet Larsa"}
          </span>
          <span aria-hidden className="text-[0.68rem] opacity-90">
            {ar ? "←" : "→"}
          </span>
        </Link>
      </div>
    </section>
  );
}
