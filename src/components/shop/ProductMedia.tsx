"use client";

import Image from "next/image";
import { useState } from "react";
import { shouldUseNativeImageElement } from "@/lib/admin/media-url";
import { cn } from "@/lib/utils";

export type ProductMediaFit = "contain" | "cover";

type Props = {
  name: string;
  imageTone: string;
  imageUrl?: string | null;
  /** Styles for the fixed aspect/size shell only (not the <img>). */
  className?: string;
  /** Transforms / filters applied to the image element (e.g. hover scale). */
  imageClassName?: string;
  /** Fixed frame ratio/size, e.g. aspect-[3/4] or h-20 w-16. */
  aspectClassName?: string;
  sizes?: string;
  priority?: boolean;
  /**
   * Beauty packshots must stay fully visible in cards → contain (default).
   * Use cover only for intentionally full-bleed editorial crops.
   */
  fit?: ProductMediaFit;
};

/**
 * Product image inside a fixed frame.
 * Aspect/size never depends on badges, wishlist, or text — only on aspectClassName.
 */
export function ProductMedia({
  name,
  imageTone,
  imageUrl,
  className,
  imageClassName,
  aspectClassName = "aspect-[3/4]",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  fit = "contain",
}: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = imageUrl?.trim() || "";
  const showImage = Boolean(src) && !failed;
  const objectFit =
    fit === "cover" ? "object-cover object-center" : "object-contain object-center";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        aspectClassName,
        className,
      )}
      style={{ background: imageTone }}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : name}
    >
      {showImage && !loaded ? (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: imageTone }}
          aria-hidden
        />
      ) : null}

      {showImage ? (
        shouldUseNativeImageElement(src) ? (
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
              "absolute inset-0 h-full w-full max-w-none transition-opacity duration-300",
              objectFit,
              loaded ? "opacity-100" : "opacity-0",
              imageClassName,
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
              "absolute inset-0 h-full w-full max-w-none transition-opacity duration-300",
              objectFit,
              loaded ? "opacity-100" : "opacity-0",
              imageClassName,
            )}
          />
        )
      ) : null}
    </div>
  );
}
