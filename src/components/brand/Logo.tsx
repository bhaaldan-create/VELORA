import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
  /** White mark for dark surfaces (footer) */
  light?: boolean;
}

const sizes = {
  sm: { width: 148, height: 56, className: "w-[118px] sm:w-[148px]" },
  md: { width: 190, height: 72, className: "w-[160px] sm:w-[190px]" },
  lg: { width: 260, height: 98, className: "w-[210px] sm:w-[260px]" },
} as const;

export function Logo({
  className,
  priority = false,
  size = "md",
  light = false,
}: LogoProps) {
  const s = sizes[size];

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center justify-center", className)}
      aria-label="VELORA — Beauty Revealed"
    >
      <Image
        src={light ? "/brand/velora-logo-clear.png" : "/brand/velora-logo-dark.png"}
        alt="VELORA Beauty Revealed"
        width={s.width}
        height={s.height}
        priority={priority}
        className={cn(
          "h-auto transition-opacity duration-300 group-hover:opacity-85",
          s.className,
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
        "font-[family-name:var(--font-brand)] text-2xl tracking-[0.28em] text-[var(--plum)] uppercase",
        className,
      )}
    >
      Velora
    </Link>
  );
}
