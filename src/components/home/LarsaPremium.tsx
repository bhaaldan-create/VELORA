"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LarsaPremium() {
  return (
    <section className="relative overflow-hidden bg-[var(--ink-deep)] text-[var(--ivory-fixed)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 85% 20%, rgba(212,181,184,0.22), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 90%, rgba(92,58,94,0.35), transparent 55%)",
        }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-20 sm:px-8 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="font-latin text-[11px] font-medium tracking-[0.28em] text-[#d4b5b8] uppercase">
            LARSA
          </p>
          <h2 className="font-display mt-4 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight">
            لستِ متأكدة من أين تبدئين؟
          </h2>
          <p className="mt-5 text-[1rem] leading-relaxed text-[var(--ivory-fixed)]/70">
            لارسا تبني طقساً هادئاً لبشرتكِ وشعركِ ومزاجكِ — ثم تختار منتجات
            حقيقية من كتالوج VELORA.
          </p>
        </div>
        <Link href="/advisor" className="shrink-0">
          <Button className="bg-[var(--ivory-fixed)] text-[var(--ink-deep)] hover:bg-[#E8DFD6]">
            ادخلي إلى لارسا
          </Button>
        </Link>
      </div>
    </section>
  );
}
