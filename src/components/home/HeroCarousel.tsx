"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocale } from "@/context/LocaleContext";
import type { HomeHeroConfig, HomeHeroSlide } from "@/lib/home/types";
import { cn } from "@/lib/utils";

function overlayStyle(level: HomeHeroSlide["overlay"]) {
  if (level === "none") return "transparent";
  if (level === "soft") {
    return "linear-gradient(90deg, rgba(250,248,252,0.72) 0%, rgba(250,248,252,0.35) 38%, transparent 62%)";
  }
  if (level === "strong") {
    return "linear-gradient(90deg, rgba(250,248,252,0.82) 0%, rgba(250,248,252,0.45) 42%, transparent 68%)";
  }
  return "linear-gradient(90deg, rgba(250,248,252,0.78) 0%, rgba(250,248,252,0.4) 40%, transparent 65%)";
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
      className="bg-[#faf8fc] px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6"
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
              <div className="absolute inset-0 bg-[#e8dff0]">
                {(mobileSrc.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mobileSrc}
                    alt=""
                    className={cn(
                      "h-full w-full object-cover md:hidden transition-transform duration-[6500ms] ease-out",
                      active && "scale-[1.03]",
                    )}
                    style={{ objectPosition: s.objectPosition || "right center" }}
                  />
                ) : (
                  <Image
                    src={mobileSrc}
                    alt=""
                    fill
                    priority={i === 0}
                    className={cn(
                      "object-cover md:hidden transition-transform duration-[6500ms] ease-out",
                      active && "scale-[1.03]",
                    )}
                    style={{ objectPosition: s.objectPosition || "right center" }}
                    sizes="100vw"
                  />
                )) as React.ReactNode}
                {(desktopSrc.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={desktopSrc}
                    alt=""
                    className={cn(
                      "hidden h-full w-full object-cover md:block transition-transform duration-[6500ms] ease-out",
                      active && "scale-[1.02]",
                    )}
                    style={{ objectPosition: s.objectPosition || "right center" }}
                  />
                ) : (
                  <Image
                    src={desktopSrc}
                    alt=""
                    fill
                    priority={i === 0}
                    className={cn(
                      "hidden object-cover md:block transition-transform duration-[6500ms] ease-out",
                      active && "scale-[1.02]",
                    )}
                    style={{ objectPosition: s.objectPosition || "right center" }}
                    sizes="(max-width: 1280px) 100vw, 1280px"
                  />
                )) as React.ReactNode}
              </div>
              <div
                className="absolute inset-0"
                style={{ background: overlayStyle(s.overlay) }}
              />
            </div>
          );
        })}

        {/* Text on visual left; Arabic reads RTL inside the block */}
        <div className="relative z-10 flex h-full min-h-[inherit] items-center justify-start px-5 py-8 sm:px-8 sm:py-10 md:px-10">
          <div
            dir={dir}
            className={cn(
              "max-w-[78%] sm:max-w-[50%] md:max-w-[42%] transition-all duration-700 ease-out",
              entered
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
          >
            <h1 className="font-display text-[clamp(1.35rem,4.8vw,2.15rem)] font-bold leading-[1.35] tracking-tight text-[#32162f]">
              {ar ? slide.headlineAr : slide.headlineEn}
            </h1>
            <p className="mt-3 text-[0.82rem] leading-[1.75] text-[#5a4a58] sm:text-[0.9rem]">
              {ar ? slide.bodyAr : slide.bodyEn}
            </p>
            <div
              className={cn(
                "mt-6 sm:mt-7 transition-all delay-150 duration-700 ease-out",
                entered
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0",
              )}
            >
              <Link
                href={slide.href || "/shop"}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#32162f] px-5 py-2.5 text-[0.8rem] font-medium text-white shadow-[0_8px_24px_rgba(50,22,47,0.18)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
            className="absolute bottom-4 start-5 z-20 flex gap-1.5 sm:bottom-5 sm:start-6"
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
                    ? "h-2 w-5 bg-[#32162f]"
                    : "h-2 w-2 bg-[#32162f]/28 hover:bg-[#32162f]/45",
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
