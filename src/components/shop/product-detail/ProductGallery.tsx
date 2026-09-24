"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductBadge, productDetailBadges } from "@/components/shop/ProductBadge";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
import { isProductInStock } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { productCopy } from "./copy";

type Props = {
  product: Product;
  ar: boolean;
};

function galleryUrls(product: Product): string[] {
  const primary = product.imageUrl?.trim();
  return primary ? [primary] : [];
}

export function ProductGallery({ product, ar }: Props) {
  const copy = productCopy(ar);
  const badges = productDetailBadges(product, ar ? "ar" : "en");
  const soldOut = !isProductInStock(product);
  const images = useMemo(() => galleryUrls(product), [product]);
  const [index, setIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; moved: boolean } | null>(null);
  const multi = images.length > 1;
  const active = images[index] ?? null;

  useEffect(() => {
    setIndex(0);
  }, [product.id]);

  const go = useCallback(
    (next: number) => {
      if (!images.length) return;
      const len = images.length;
      setIndex(((next % len) + len) % len);
    },
    [images.length],
  );

  const setZoomOrigin = (clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--pdp-zoom-x", `${x}%`);
    el.style.setProperty("--pdp-zoom-y", `${y}%`);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!multi) return;
    drag.current = { id: e.pointerId, x: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    if (Math.abs(e.clientX - drag.current.x) > 12) drag.current.moved = true;
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const dx = e.clientX - drag.current.x;
    const moved = drag.current.moved;
    drag.current = null;
    if (!moved || Math.abs(dx) < 40) return;
    const rtl =
      typeof document !== "undefined" && document.documentElement.dir === "rtl";
    if (rtl) {
      go(dx > 0 ? index + 1 : index - 1);
    } else {
      go(dx > 0 ? index - 1 : index + 1);
    }
  };

  return (
    <div className="pdp-gallery motion-safe:animate-[velora-fade_0.95s_ease-out_both]">
      <div
        ref={stageRef}
        className={cn(
          "pdp-gallery__stage relative overflow-hidden",
          "rounded-[1.35rem] sm:rounded-[1.75rem]",
          "ring-1 ring-[var(--plum)]/[0.08]",
          "shadow-[0_18px_48px_-28px_rgba(50,22,47,0.28)]",
          zooming && "is-zooming",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={(e) => setZoomOrigin(e.clientX, e.clientY)}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: `
              radial-gradient(90% 70% at 50% 18%, rgba(255,255,255,0.55), transparent 58%),
              linear-gradient(180deg, rgba(248,244,241,0.28), rgba(243,237,245,0.18) 55%, rgba(248,244,241,0.32))
            `,
          }}
        />

        <ProductMedia
          name={ar ? product.nameAr : product.name}
          imageTone={product.imageTone || "#f3edf5"}
          imageUrl={active}
          aspectClassName="aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]"
          className="relative z-0 w-full"
          sizes="(max-width: 1024px) 100vw, 48vw"
          priority
          fit="contain"
          imageClassName={cn(
            "pdp-gallery__img",
            soldOut && "opacity-[0.72]",
          )}
        />

        <div className="pointer-events-none absolute inset-0 z-[2]">
          {soldOut ? (
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,18,20,0.06),rgba(28,18,20,0.18))]"
            />
          ) : null}

          <WishlistHeartButton
            productId={product.id}
            className={cn(
              "pointer-events-auto absolute end-3 top-3 sm:end-4 sm:top-4",
              "rounded-full border border-[var(--border-glass)] bg-[var(--bg-glass)] p-2.5",
              "text-[var(--plum)] shadow-[var(--shadow-sm)] backdrop-blur-md",
              "transition hover:scale-[1.04] active:scale-95",
            )}
          />

          {badges.length > 0 ? (
            <div className="absolute start-3 top-3 flex max-w-[70%] flex-wrap gap-1.5 sm:start-4 sm:top-4">
              {badges.map((b) => (
                <ProductBadge
                  key={b.key}
                  label={b.label}
                  size="md"
                  tone={b.tone}
                />
              ))}
            </div>
          ) : null}

          {multi ? (
            <div
              className={cn(
                "absolute bottom-3 start-1/2 z-[3] -translate-x-1/2",
                "rounded-full bg-[var(--bg-glass-strong)] px-3 py-1",
                "text-[0.68rem] font-medium tabular-nums text-[var(--plum)]",
                "ring-1 ring-[var(--plum)]/[0.08] backdrop-blur-md",
              )}
              aria-live="polite"
            >
              {index + 1} {copy.imageOf} {images.length}
            </div>
          ) : null}
        </div>
      </div>

      {multi ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 admin-scroll">
          {images.map((src, i) => (
            <li key={`${src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative h-16 w-14 overflow-hidden rounded-xl ring-1 transition",
                  i === index
                    ? "ring-[var(--plum)]/35"
                    : "ring-[var(--plum)]/10 opacity-80 hover:opacity-100",
                )}
              >
                <ProductMedia
                  name=""
                  imageTone={product.imageTone}
                  imageUrl={src}
                  aspectClassName="h-full w-full"
                  fit="contain"
                  sizes="56px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ProductBrandLogo
        brandName={product.brandName}
        brandLogoUrl={product.brandLogoUrl}
      />
    </div>
  );
}

/** @deprecated Prefer ProductGallery */
export const ProductHeroImage = ProductGallery;

export function ProductBrandLogo({
  brandName,
  brandLogoUrl,
}: {
  brandName?: string | null;
  brandLogoUrl?: string | null;
}) {
  if (!brandLogoUrl) return null;
  const useNative = shouldUseNativeImageElement(brandLogoUrl);

  return (
    <div
      className="mt-4 flex flex-col items-center motion-safe:animate-[velora-rise_0.7s_0.12s_ease-out_both] sm:mt-5"
      dir="ltr"
    >
      <div className="mb-3 h-px w-9 bg-[var(--plum)]/12" aria-hidden />
      <div className="relative flex h-8 max-w-[min(100%,220px)] items-center justify-center sm:h-9 sm:max-w-[260px]">
        {useNative ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandLogoUrl}
            alt={brandName ? `${brandName} logo` : "Brand logo"}
            className="h-auto max-h-8 w-auto max-w-full object-contain object-center opacity-90 sm:max-h-9"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Image
            src={brandLogoUrl}
            alt={brandName ? `${brandName} logo` : "Brand logo"}
            width={260}
            height={36}
            className="h-auto max-h-8 w-auto max-w-full object-contain object-center opacity-90 sm:max-h-9"
          />
        )}
      </div>
    </div>
  );
}
