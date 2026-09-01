"use client";

import Image from "next/image";
import { LARSA_PATHS } from "@/data/larsa-consultation";
import { LARSA_EXPLORE_TOPICS } from "@/data/larsa-knowledge";
import { LarsaPathIcon } from "@/components/advisor/LarsaIcons";
import { cn } from "@/lib/utils";
import type { LarsaPathDef } from "@/data/larsa-consultation";

export function LarsaLobby({
  onSelect,
  onOpenChat,
  onQuickPrompt,
}: {
  onSelect: (path: LarsaPathDef) => void;
  onOpenChat: () => void;
  onQuickPrompt?: (prompt: string) => void;
}) {
  return (
    <div
      dir="rtl"
      className="larsa-lobby relative min-h-[calc(100vh-5rem)] overflow-x-hidden bg-[var(--larsa-wash)]"
    >
      <div className="larsa-lobby-ambient pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-14">
        {/* Hero — LARSA concierge identity only */}
        <header className="larsa-hero mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="larsa-hero-logo-stage relative">
            <div className="larsa-hero-glow" aria-hidden />
            <Image
              src="/brand/larsa-logo.png"
              alt="LARSA"
              width={320}
              height={256}
              priority
              className="larsa-hero-logo relative z-[1] h-auto w-[148px] sm:w-[176px] lg:w-[196px]"
              sizes="(max-width: 640px) 148px, (max-width: 1024px) 176px, 196px"
            />
          </div>

          <p className="larsa-hero-eyebrow mt-7 font-latin text-[10px] font-medium tracking-[0.26em] text-[var(--larsa-muted)] uppercase sm:mt-8">
            VELORA Beauty Concierge
          </p>

          <h1 className="larsa-hero-title font-display mt-3 text-[clamp(1.55rem,4.5vw,2.15rem)] font-semibold leading-[var(--lh-snug)] text-[var(--larsa-plum)]">
            مستشارك الشخصي للجمال
          </h1>

          <p className="larsa-hero-desc mt-3 max-w-sm text-[0.95rem] leading-relaxed text-[var(--larsa-plum-soft)] sm:mt-3.5 sm:text-[1.02rem]">
            استشارة خاصة ترشدكِ لما يناسبكِ من مجموعة VELORA.
          </p>

          <p className="larsa-hero-invite mt-6 text-[0.95rem] font-medium text-[var(--larsa-plum)] sm:mt-7">
            كيف يمكنني مساعدتكِ اليوم؟
          </p>

          <button
            type="button"
            onClick={onOpenChat}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--larsa-plum)]/25 bg-white px-6 py-3 text-[0.9rem] font-medium text-[var(--larsa-plum)] shadow-sm transition hover:border-[var(--larsa-plum)]/45 hover:bg-[var(--larsa-lavender)]/40"
          >
            <span className="font-latin text-[11px] tracking-[0.18em]">CHAT</span>
            <span>تحدّثي مع لارسا مباشرة</span>
          </button>
        </header>

        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8">
          {LARSA_EXPLORE_TOPICS.slice(0, 6).map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => (onQuickPrompt ? onQuickPrompt(topic.prompt) : onOpenChat())}
              className="rounded-full bg-white px-3.5 py-2 text-[12px] text-[var(--larsa-plum-soft)] ring-1 ring-[var(--larsa-border)] transition hover:bg-[var(--larsa-lavender)]/50 hover:text-[var(--larsa-plum)]"
            >
              {topic.titleAr}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {LARSA_PATHS.map((path) => (
            <button
              key={path.id}
              type="button"
              onClick={() => onSelect(path)}
              className={cn(
                "group flex flex-col items-start rounded-[22px] border bg-[var(--larsa-white)] p-6 text-start transition-all duration-[220ms] ease-out sm:p-7",
                "motion-safe:hover:-translate-y-1",
                path.featured
                  ? "border-[var(--larsa-lavender-deep)] bg-[var(--larsa-lavender)]/50 hover:border-[var(--larsa-border-strong)]"
                  : "border-[var(--larsa-border)] hover:border-[var(--larsa-border-strong)] hover:bg-[var(--larsa-lavender)]/40",
              )}
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--larsa-plum-soft)] transition-colors duration-[220ms] group-hover:bg-[var(--larsa-lavender)] group-hover:text-[var(--larsa-plum)]">
                  <LarsaPathIcon name={path.icon} />
                </span>
                <span className="font-latin text-[11px] font-medium tracking-[0.16em] text-[var(--larsa-muted)]">
                  {path.number}
                </span>
              </div>
              <h2 className="mt-5 text-[1.05rem] font-semibold leading-snug text-[var(--larsa-plum)]">
                {path.title}
              </h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--larsa-plum-soft)]">
                {path.desc}
              </p>
            </button>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-md text-center text-[0.8rem] leading-relaxed text-[var(--larsa-muted)]">
          استشارة خاصة داخل VELORA — توصيات من مجموعتنا فقط.
        </p>
      </div>
    </div>
  );
}
