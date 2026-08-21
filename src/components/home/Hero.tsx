import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { brand, ui } from "@/constants/brand";

export function Hero() {
  return (
    <section className="relative isolate min-h-[92vh] overflow-hidden bg-[#1a1410] text-[var(--ivory)]">
      {/* Full-bleed beauty photography */}
      <Image
        src="/brands/products/hero-beauty.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_30%] opacity-55"
        sizes="100vw"
      />

      {/* Luxurious layered wash — silk champagne + deep ink, not flat purple */}
      <div
        className="absolute inset-0 animate-[velora-fade_1.6s_ease-out_both]"
        style={{
          background: `
            linear-gradient(105deg, rgba(18,12,14,0.92) 0%, rgba(28,18,24,0.72) 42%, rgba(61,38,64,0.35) 68%, rgba(232,223,214,0.18) 100%),
            radial-gradient(ellipse 70% 55% at 78% 28%, rgba(212,181,184,0.28) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 12% 85%, rgba(233,223,214,0.14) 0%, transparent 50%)
          `,
        }}
      />

      {/* Soft film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Gold hairline accents */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#C4A574]/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-[#C4A574]/35 to-transparent" />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20 lg:justify-center lg:pb-28">
        <div className="max-w-2xl">
          <div className="animate-[velora-rise_1s_0.12s_ease-out_both] flex items-center gap-4">
            <span className="h-px w-10 bg-[#C4A574]/70" />
            <p className="t1 tracking-[0.42em] text-[#E8D5B5] uppercase">
              {brand.tagline}
            </p>
          </div>

          <h1
            className="font-brand animate-[velora-rise_1.15s_0.25s_ease-out_both] mt-7 text-[clamp(3.4rem,9vw,6.5rem)] leading-[0.92] font-medium tracking-[0.28em] text-[#F7F1EA] uppercase"
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.35)",
            }}
          >
            Velora
          </h1>

          <p className="t1 animate-[velora-rise_1.1s_0.35s_ease-out_both] mt-4 tracking-[0.35em] text-[#C4A574]/90 uppercase">
            الصفحة الرئيسية
          </p>

          <p className="t5 animate-[velora-rise_1.1s_0.45s_ease-out_both] mt-7 max-w-md leading-relaxed text-[#F1EAE6]/88">
            مختارات عالمية من أفضل البراندات — فخامة هادئة لبشرة، جسم، شعر ومكياج.
          </p>

          <div className="animate-[velora-rise_1.1s_0.58s_ease-out_both] mt-10 flex flex-wrap gap-4">
            <Link href="/shop">
              <Button className="bg-[#F7F1EA] text-[#2A1A2C] hover:bg-[#E8DFD6]">
                اكتشفي المجموعة
              </Button>
            </Link>
            <Link href="/advisor">
              <Button
                variant="outline"
                className="border-[#E8D5B5]/40 text-[#F7F1EA] hover:border-[#E8D5B5]/70 hover:bg-white/5"
              >
                {ui.advisor}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
