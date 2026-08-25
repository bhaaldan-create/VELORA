"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocale } from "@/context/LocaleContext";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
import type { HomeHeroConfig, HomeHeroSlide } from "@/lib/home/types";
import { cn } from "@/lib/utils";

function overlayStyle(level: HomeHeroSlide["overlay"]) {
  // Soft bottom-left readability wash — keeps the hero image clear elsewhere
  if (level === "none") {
    return "linear-gradient(to top right, rgba(12,8,16,0.42) 0%, rgba(12,8,16,0.18) 28%, transparent 52%)";
  }
  if (level === "strong") {
    return "linear-gradient(to top right, rgba(12,8,16,0.55) 0%, rgba(12,8,16,0.28) 32%, transparent 58%)";
  }
  // soft / medium (default)
  return "linear-gradient(to top right, rgba(12,8,16,0.48) 0%, rgba(12,8,16,0.22) 30%, transparent 55%)";
}

function HeroSlidePicture({
  src,
  className,
  style,
  priority,
  sizes,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
}) {
  if (shouldUseNativeImageElement(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={className} style={style} />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      className={className}
      style={style}
      sizes={sizes}
    />
  );
}

export function HeroCarousel({ config }: { config: HomeHeroConfig }) {
  const { locale, dir } = useLocale();
  const ar = locale !== "en";
  const slides = config.slides.filter((s) => s.enabled);
  const list = slides.length ? slides : config.slides.slice(0, 1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [entered, setEntered] = useState(false);
  const dragRef = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const autoplayMs = config.autoplayMs || 5500;

  const go = useCallback(
    (next: number) => {
      const len = list.length;
      if (!len) return;
      setIndex(((next % len) + len) % len);
      setEntered(false);
      window.requestAnimationFrame(() => setEntered(true));
    },
    [list.length],
  );

  useEffect(() => {
    setEntered(true);
  }, []);

  useEffect(() => {
    if (paused || list.length < 2) return;
    const id = window.setInterval(() => go(index + 1), autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, go, index, list.length, paused]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setPaused(true);
        go(ar ? index + 1 : index - 1);
      }
      if (e.key === "ArrowRight") {
        setPaused(true);
        go(ar ? index - 1 : index + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ar, go, index]);

  function onPointerDown(e: ReactPointerEvent) {
    dragRef.current = { x: e.clientX, active: true };
    setPaused(true);
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    dragRef.current.active = false;
    if (Math.abs(dx) < 48) return;
    if (dx > 0) go(ar ? index + 1 : index - 1);
    else go(ar ? index - 1 : index + 1);
  }

  const slide = list[index]!;

  return (
    <section
      className="bg-[var(--background)] px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6"
      aria-label="VELORA campaigns"
    >
      <div
        className="home-hero relative mx-auto max-w-7xl overflow-hidden rounded-[22px] sm:rounded-[26px]"
        aria-roledescription="carousel"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {list.map((s, i) => {
          const active = i === index;
          const desktopSrc = s.imageUrl;
          const mobileSrc = s.imageUrlMobile || s.imageUrl;
          return (
            <div
              key={s.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                active ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none",
              )}
              aria-hidden={!active}
            >
              <div className="absolute inset-0 bg-[var(--mist)]">
                <HeroSlidePicture
                  src={mobileSrc}
                  className={cn(
                    "object-cover md:hidden transition-transform duration-[6500ms] ease-out",
                    shouldUseNativeImageElement(mobileSrc) && "h-full w-full",
                    active && "scale-[1.03]",
                  )}
                  style={{ objectPosition: s.objectPosition || "right center" }}
                  priority={i === 0}
                  sizes="100vw"
                />
                <HeroSlidePicture
                  src={desktopSrc}
                  className={cn(
                    "hidden object-cover md:block transition-transform duration-[6500ms] ease-out",
                    shouldUseNativeImageElement(desktopSrc) && "h-full w-full",
                    active && "scale-[1.02]",
                  )}
                  style={{ objectPosition: s.objectPosition || "right center" }}
                  priority={i === 0}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
              </div>
              <div
                className="absolute inset-0"
                style={{ background: overlayStyle(s.overlay) }}
              />
            </div>
          );
        })}

        {/* Text — bottom-left, white copy with soft shadow */}
        <div className="relative z-10 flex h-full min-h-[inherit] items-end justify-start px-5 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10 md:px-10">
          <div
            dir={dir}
            className={cn(
              "max-w-[85%] sm:max-w-[52%] md:max-w-[44%] transition-all duration-700 ease-out",
              entered
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
          >
            <h1
              className="font-display text-[clamp(1.35rem,4.8vw,2.15rem)] font-black leading-[1.35] tracking-tight text-white"
              style={{
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.65), 0 6px 18px rgba(0,0,0,0.55), 0 0 28px rgba(0,0,0,0.35)",
              }}
            >
              {ar ? slide.headlineAr : slide.headlineEn}
            </h1>
            <p
              className="mt-2 text-[0.82rem] leading-[1.7] text-white sm:mt-2.5 sm:text-[0.9rem]"
              style={{
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6), 0 5px 14px rgba(0,0,0,0.45)",
              }}
            >
              {ar ? slide.bodyAr : slide.bodyEn}
            </p>
            <div
              className={cn(
                "mt-3 sm:mt-3.5 transition-all delay-100 duration-700 ease-out",
                entered
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0",
              )}
            >
              <Link
                href={slide.href || "/shop"}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory-fixed)] px-5 py-2.5 text-[0.8rem] font-medium text-[var(--ink-deep)] shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {ar ? slide.ctaAr : slide.ctaEn}
                <span aria-hidden className="text-[0.75rem] opacity-90">
                  {ar ? "←" : "→"}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {list.length > 1 ? (
          <div
            className="absolute bottom-4 end-5 z-20 flex gap-1.5 sm:bottom-5 sm:end-6"
            role="tablist"
            aria-label="Hero slides"
          >
            {list.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === index
                    ? "h-2 w-5 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.35)]"
                    : "h-2 w-2 bg-white/45 hover:bg-white/70",
                )}
                onClick={() => {
                  setPaused(true);
                  go(i);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
