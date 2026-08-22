"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/ProductCard";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  className?: string;
};

export function ProductSwiper({ products, className }: Props) {
  const { dir } = useLocale();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    if (!swiper || swiper.destroyed) return;
    // Re-init navigation once refs are mounted
    if (
      swiper.params.navigation &&
      typeof swiper.params.navigation === "object"
    ) {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
      swiper.navigation.destroy();
      swiper.navigation.init();
      swiper.navigation.update();
    }
    swiper.changeLanguageDirection(dir);
    swiper.update();
  }, [swiper, dir, products.length]);

  if (!products.length) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={prevRef}
        type="button"
        aria-label="Previous"
        className={cn(
          "absolute top-[32%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center",
          "border border-[var(--plum)]/12 bg-[var(--ivory)]/90 text-[var(--plum)] backdrop-blur-sm",
          "transition-opacity duration-300 hover:border-[var(--plum)]/30 md:flex",
          dir === "rtl" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2",
          atStart && "pointer-events-none opacity-0",
        )}
      >
        <Chevron dir={dir === "rtl" ? "next" : "prev"} />
      </button>
      <button
        ref={nextRef}
        type="button"
        aria-label="Next"
        className={cn(
          "absolute top-[32%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center",
          "border border-[var(--plum)]/12 bg-[var(--ivory)]/90 text-[var(--plum)] backdrop-blur-sm",
          "transition-opacity duration-300 hover:border-[var(--plum)]/30 md:flex",
          dir === "rtl" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
          atEnd && "pointer-events-none opacity-0",
        )}
      >
        <Chevron dir={dir === "rtl" ? "prev" : "next"} />
      </button>

      <Swiper
        key={dir}
        modules={[Navigation, Pagination, FreeMode]}
        onSwiper={setSwiper}
        onSlideChange={(s) => {
          setAtStart(s.isBeginning);
          setAtEnd(s.isEnd);
        }}
        onReachBeginning={() => setAtStart(true)}
        onReachEnd={() => setAtEnd(true)}
        onFromEdge={(s) => {
          setAtStart(s.isBeginning);
          setAtEnd(s.isEnd);
        }}
        dir={dir}
        slidesPerView={1.25}
        spaceBetween={14}
        freeMode={{ enabled: true, sticky: false }}
        grabCursor
        resistanceRatio={0.75}
        pagination={{
          clickable: true,
          el: undefined,
        }}
        breakpoints={{
          480: { slidesPerView: 1.45, spaceBetween: 16 },
          640: { slidesPerView: 2.2, spaceBetween: 18 },
          768: { slidesPerView: 2.6, spaceBetween: 20 },
          1024: { slidesPerView: 3.2, spaceBetween: 22 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="velora-swiper !overflow-visible pb-10"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="!h-auto">
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={dir === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
