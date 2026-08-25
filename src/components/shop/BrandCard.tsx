"use client";

import Link from "next/link";
import { useState } from "react";
import type { ShopBrand } from "@/data/shop-brands";
import { cn } from "@/lib/utils";

export function BrandCard({
  brand,
  locale,
}: {
  brand: ShopBrand;
  locale: "ar" | "en";
}) {
  const [failed, setFailed] = useState(false);
  const scale = brand.opticalScale ?? 0.78;

  return (
    <Link
      href={`/shop?brand=${brand.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.85rem]",
        "border border-white/70 bg-white/55 backdrop-blur-[10px]",
        "shadow-[0_14px_36px_-22px_rgba(61,38,64,0.28),0_1px_0_rgba(255,255,255,0.85)_inset]",
        "ring-1 ring-[var(--plum)]/[0.05]",
        "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-[3px] hover:shadow-[0_22px_44px_-20px_rgba(125,95,146,0.32),0_1px_0_rgba(255,255,255,0.9)_inset]",
        "hover:ring-[var(--plum)]/12",
        "active:scale-[0.97] active:opacity-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9578a8]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F7]",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: brand.wash }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(179,155,192,0.22),transparent_70%)] opacity-70"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0))]"
      />

      <div className="relative z-[1] flex flex-1 flex-col p-3.5 sm:p-4">
        <div
          className={cn(
            "relative mx-auto flex aspect-square w-full max-w-[7.5rem] items-center justify-center overflow-hidden rounded-[1.35rem]",
            "bg-white/80 shadow-[0_8px_22px_-14px_rgba(61,38,64,0.22)]",
            "ring-1 ring-white/80",
          )}
        >
          {!failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo}
              alt={brand.name}
              width={160}
              height={160}
              loading="lazy"
              decoding="async"
              className="object-contain"
              style={{
                width: `${scale * 100}%`,
                height: `${scale * 100}%`,
                maxWidth: "90%",
                maxHeight: "90%",
              }}
              onError={() => setFailed(true)}
            />
          ) : (
            <span
              aria-hidden
              className="h-8 w-8 rounded-full bg-[var(--plum)]/[0.06]"
            />
          )}
        </div>

        <div className="mt-3 text-center">
          <p
            className="font-latin line-clamp-2 text-[0.78rem] font-semibold leading-snug text-[#2a1a2c] sm:text-[0.84rem]"
            dir="ltr"
          >
            {brand.name}
          </p>
          {locale === "ar" ? (
            <p className="mt-1 line-clamp-1 text-[0.7rem] text-[#8a7588]">
              {brand.nameAr}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
