"use client";

import Image from "next/image";
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

/** صورة المنتج أو التدرج الاحتياطي إن لم تُرفع صورة */
export function ProductMedia({
  name,
  imageTone,
  imageUrl,
  className,
  aspectClassName = "aspect-[3/4]",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: Props) {
  if (imageUrl) {
    const isDataUrl = imageUrl.startsWith("data:");
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--mist)]",
          aspectClassName,
          className,
        )}
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isDataUrl}
          className="object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(aspectClassName, className)}
      style={{ background: imageTone }}
      role="img"
      aria-label={name}
    />
  );
}
