"use client";

import { LARSA_PATHS } from "@/data/larsa-consultation";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import { LarsaMark, LarsaPathIcon } from "@/components/advisor/LarsaIcons";
import { cn } from "@/lib/utils";
import type { LarsaPathDef } from "@/data/larsa-consultation";

export function LarsaLobby({ onSelect }: { onSelect: (path: LarsaPathDef) => void }) {
  return (
    <div
      dir="rtl"
      className="relative min-h-[calc(100vh-5rem)] overflow-x-hidden bg-[var(--larsa-white)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 38% at 50% 0%, rgba(243,237,245,0.95), transparent 58%), radial-gradient(ellipse 35% 30% at 90% 40%, rgba(232,221,235,0.45), transparent 55%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <header className="flex flex-col items-center text-center">
          <p className="font-latin text-[11px] font-medium tracking-[0.28em] text-[var(--larsa-plum-soft)] uppercase">
            VELORA BEAUTY
          </p>
          <div className="mt-5 flex items-center gap-3">
            <LarsaMark size={42} />
          </div>
          <p className="font-latin mt-4 text-[1.45rem] font-semibold tracking-[0.3em] text-[var(--larsa-plum)]">
            LARSA
          </p>
          <p className="mt-2 text-[1rem] text-[var(--larsa-plum-soft)]">
            مستشارتكِ الشخصية للجمال
          </p>
        </header>

        <div className="mt-12 flex justify-center sm:mt-14">
          <LarsaAvatar size="xl" active />
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center sm:mt-14">
          <h1 className="font-display text-[clamp(1.75rem,4.2vw,2.65rem)] font-semibold leading-snug text-[var(--larsa-plum)]">
            أهلاً بكِ في لارسا
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-[var(--larsa-plum-soft)]">
            مستشارتكِ الشخصية لاكتشاف ما يناسب جمالكِ.
          </p>
          <p className="mt-10 text-[1.1rem] font-medium text-[var(--larsa-plum)]">
            كيف يمكنني مساعدتكِ اليوم؟
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
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
