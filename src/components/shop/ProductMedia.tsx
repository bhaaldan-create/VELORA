"use client";

import Image from "next/image";
import { useState } from "react";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  imageTone: string;
  imageUrl?: string | null;
  className?: string;
  /** نسب العرض مثل aspect-[3/4] */
  aspectClassName?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * صورة المنتج داخل مساحة ثابتة (aspect).
 * Full-bleed: تملأ الحاوية بالكامل بدون padding أو خلفية ثيم ظاهرة حولها.
 * /api/media و data: تستخدم <img> الأصلي — محسّن next/image لا يدعمها.
 */
export function ProductMedia({
  name,
  imageTone,
  imageUrl,
  className,
  aspectClassName = "aspect-[3/4]",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = imageUrl?.trim() || "";
  const showImage = Boolean(src) && !failed;

  if (showImage) {
    const useNative = shouldUseNativeImageElement(src);
    return (
      <div
        className={cn(
          "relative isolate h-full w-full overflow-hidden",
          aspectClassName,
          className,
        )}
      >
        {!loaded ? (
          <div
            className="absolute inset-0 animate-pulse"
            style={{ background: imageTone }}
            aria-hidden
          />
        ) : null}
        {useNative ? (
          // eslint-disable-next-line @next/next/no-img-element -- /api/media & data URLs
          <img
            src={src}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              setLoaded(true);
              if (process.env.NODE_ENV === "development") {
                console.warn("[ProductMedia] image failed", { name, src });
              }
            }}
            className={cn(
              "absolute inset-0 h-full w-full max-w-none object-cover object-center transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <Image
            src={src}
            alt={name}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              setLoaded(true);
              if (process.env.NODE_ENV === "development") {
                console.warn("[ProductMedia] image failed", { name, src });
              }
            }}
            className={cn(
              "absolute inset-0 h-full w-full max-w-none object-cover object-center transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("w-full", aspectClassName, className)}
      style={{ background: imageTone }}
      role="img"
      aria-label={name}
    />
  );
}
