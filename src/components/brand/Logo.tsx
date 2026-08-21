import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
  /** Light silhouette for dark backgrounds */
  inverted?: boolean;
}

/** Transparent PNG ~884×243 */
const sizes = {
  sm: { width: 140, height: 39, className: "w-[118px] sm:w-[140px]" },
  md: { width: 180, height: 50, className: "w-[150px] sm:w-[180px]" },
  lg: { width: 260, height: 72, className: "w-[200px] sm:w-[260px]" },
} as const;

export function Logo({
  className,
  priority = false,
  size = "md",
  inverted = false,
}: LogoProps) {
  const s = sizes[size];

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center justify-center", className)}
      aria-label="VELORA — Beauty Revealed"
    >
      <Image
        src="/brand/velora-logo.png"
        alt="VELORA Beauty Revealed"
        width={s.width}
        height={s.height}
        priority={priority}
        className={cn(
          "h-auto transition-opacity duration-300 group-hover:opacity-80",
          s.className,
          inverted && "brightness-0 invert",
        )}
      />
    </Link>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-[family-name:var(--font-display)] text-2xl tracking-[0.2em] text-[var(--plum)] uppercase",
        className,
      )}
    >
      Velora
    </Link>
  );
}
