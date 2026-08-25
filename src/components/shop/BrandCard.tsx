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
        "border border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-[10px]",
        "shadow-[var(--shadow-md)]",
        "ring-1 ring-[var(--plum)]/[0.05]",
        "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-[3px] hover:shadow-[var(--shadow-lg)]",
        "hover:ring-[var(--plum)]/12",
        "active:scale-[0.97] active:opacity-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plum)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
      )}
    >
      <span
        aria-hidden
        className="brand-card-wash pointer-events-none absolute inset-0 opacity-90 [[data-theme=dark]_&]:opacity-[0.14]"
        style={{ background: brand.wash }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(179,155,192,0.22),transparent_70%)] opacity-70 [[data-theme=dark]_&]:opacity-30"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-elevated)_55%,transparent),transparent)]"
      />

      <div className="relative z-[1] flex flex-1 flex-col p-3.5 sm:p-4">
        <div
          className={cn(
            "relative mx-auto flex aspect-square w-full max-w-[7.5rem] items-center justify-center overflow-hidden rounded-[1.35rem]",
            /* خلفية فاتحة ثابتة لشعارات البراند — ليست لون ثيم */
            "bg-[var(--ivory-fixed)] shadow-[var(--shadow-sm)]",
            "ring-1 ring-[var(--border)]",
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
            className="font-latin line-clamp-2 text-[0.78rem] font-semibold leading-snug text-[var(--ink)] sm:text-[0.84rem]"
            dir="ltr"
          >
            {brand.name}
          </p>
          {locale === "ar" ? (
            <p className="mt-1 line-clamp-1 text-[0.7rem] text-[var(--muted)]">
              {brand.nameAr}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
