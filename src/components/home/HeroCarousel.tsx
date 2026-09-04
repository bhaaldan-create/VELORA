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

/** Soft readability wash — confined to the copy zone, never a heavy vignette. */
function overlayStyle(level: HomeHeroSlide["overlay"]) {
  // Bottom black lift for copy legibility + light side fade
  const bottomLift =
    "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.32) 22%, rgba(0,0,0,0.10) 48%, transparent 72%)";
  if (level === "none") {
    return `${bottomLift}, linear-gradient(to top right, rgba(0,0,0,0.18) 0%, transparent 42%)`;
  }
  if (level === "strong") {
    return `${bottomLift}, linear-gradient(to top right, rgba(0,0,0,0.28) 0%, transparent 48%)`;
  }
  // soft / medium
  return `${bottomLift}, linear-gradient(to top right, rgba(0,0,0,0.22) 0%, transparent 45%)`;
}

function alignClass(align: HomeHeroSlide["textAlign"] | undefined) {
  if (align === "center") {
    return {
      shell: "items-end justify-center text-center",
      content: "items-center text-center",
      max: "max-w-[min(92%,28rem)] sm:max-w-[min(70%,30rem)]",
    };
  }
  if (align === "end") {
    return {
      shell: "items-end justify-end text-end",
      content: "items-end text-end",
      max: "max-w-[min(88%,26rem)] sm:max-w-[min(54%,28rem)] md:max-w-[min(46%,30rem)]",
    };
  }
  // start (default) — logical start follows RTL/LTR via dir on content
  return {
    shell: "items-end justify-start text-start",
    content: "items-stretch text-start",
    max: "max-w-[min(88%,26rem)] sm:max-w-[min(54%,28rem)] md:max-w-[min(46%,30rem)]",
  };
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
      <img
        src={src}
        alt=""
        className={className}
        style={style}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          if (process.env.NODE_ENV === "development") {
            console.warn("[HeroSlidePicture] image failed", src);
          }
        }}
      />
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
  const [entered, setEntered] = useState(true);
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
  const align = alignClass(slide.textAlign);

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
                aria-hidden
              />
            </div>
          );
        })}

        {/* Unified copy composition — Headline → Subheadline → CTA */}
        <div
          className={cn(
            "relative z-10 flex h-full min-h-[inherit]",
            align.shell,
            "home-hero-safe",
          )}
        >
          <div
            dir={dir}
            className={cn(
              "home-hero-content flex w-full flex-col",
              align.content,
              align.max,
              "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              entered ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0",
            )}
          >
            <h1 className="home-hero-headline font-display">
              {ar ? slide.headlineAr : slide.headlineEn}
            </h1>
            <p className="home-hero-sub">
              {ar ? slide.bodyAr : slide.bodyEn}
            </p>
            <div
              className={cn(
                "home-hero-cta-wrap transition-[opacity,transform] delay-75 duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                entered ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
              )}
            >
              <Link
                href={slide.href || "/shop"}
                className="home-hero-cta"
              >
                <span>{ar ? slide.ctaAr : slide.ctaEn}</span>
                <span className="home-hero-cta-arrow" aria-hidden>
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
                    ? "h-1.5 w-5 bg-white/95"
                    : "h-1.5 w-1.5 bg-white/40 hover:bg-white/65",
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
