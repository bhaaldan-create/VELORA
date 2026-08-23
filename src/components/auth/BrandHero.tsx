import { authCopy } from "@/components/auth/auth-copy";
import { Logo } from "@/components/brand/Logo";
import type { Locale } from "@/i18n/dictionaries";
import { Sparkles } from "lucide-react";

export function BrandHero({ locale }: { locale: Locale }) {
  const copy = authCopy(locale);

  return (
    <section className="relative z-10 px-5 pb-6 pt-2 text-center sm:px-8 sm:pb-8">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3">
        <Logo size="lg" priority className="mb-1" />
        <div className="relative">
          <Sparkles
            size={14}
            className="auth-sparkle absolute -top-1 end-0 translate-x-1/2"
            aria-hidden
          />
          <h1 className="font-display text-[1.625rem] font-semibold leading-snug text-[var(--velora-plum)] sm:text-[1.875rem]">
            {copy.welcome}
          </h1>
        </div>
        <p className="max-w-sm text-[0.9375rem] leading-relaxed text-[var(--velora-mauve)]">
          {copy.tagline}
        </p>
      </div>
    </section>
  );
}
