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

/**
 * صورة المنتج داخل مساحة ثابتة (aspect).
 * Full-bleed: تملأ الحاوية بالكامل بدون padding أو خلفية ثيم ظاهرة حولها.
 * object-cover + object-center يملآن الإطار لأي نسبة أبعاد؛ القصّ يكون طفيفاً على الحواف فقط.
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
  if (imageUrl) {
    const isDataUrl = imageUrl.startsWith("data:");
    return (
      <div
        className={cn(
          "relative isolate h-full w-full overflow-hidden",
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
          className="absolute inset-0 h-full w-full max-w-none object-cover object-center"
        />
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
