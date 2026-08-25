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
import { CompactProductCard } from "@/components/shop/CompactProductCard";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";

export function ShopProductSwiper({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  const { dir } = useLocale();
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  useEffect(() => {
    if (!swiper || swiper.destroyed) return;
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
          "absolute top-[28%] z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--plum)]/12 bg-[var(--bg-glass-strong)] text-[var(--plum)] backdrop-blur-sm md:flex",
          dir === "rtl" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2",
        )}
      >
        <Chevron dir={dir === "rtl" ? "next" : "prev"} />
      </button>
      <button
        ref={nextRef}
        type="button"
        aria-label="Next"
        className={cn(
          "absolute top-[28%] z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--plum)]/12 bg-[var(--bg-glass-strong)] text-[var(--plum)] backdrop-blur-sm md:flex",
          dir === "rtl" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
        )}
      >
        <Chevron dir={dir === "rtl" ? "prev" : "next"} />
      </button>

      <Swiper
        key={dir}
        modules={[Navigation, Pagination, FreeMode]}
        onSwiper={setSwiper}
        dir={dir}
        slidesPerView={2.15}
        spaceBetween={10}
        freeMode={{ enabled: true, sticky: false }}
        grabCursor
        pagination={{ clickable: true }}
        breakpoints={{
          480: { slidesPerView: 2.4, spaceBetween: 12 },
          640: { slidesPerView: 3.2, spaceBetween: 12 },
          768: { slidesPerView: 3.6, spaceBetween: 14 },
          1024: { slidesPerView: 4.5, spaceBetween: 14 },
          1280: { slidesPerView: 5.2, spaceBetween: 16 },
        }}
        className="velora-swiper !overflow-hidden pb-9"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="!h-auto">
            <CompactProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
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
