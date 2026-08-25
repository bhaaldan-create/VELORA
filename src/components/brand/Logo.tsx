import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
  /**
   * White mark for always-dark surfaces (footer).
   * When omitted, both assets render and CSS picks by [data-theme].
   */
  light?: boolean;
}

const sizes = {
  sm: { width: 148, height: 56, className: "w-[118px] sm:w-[148px]" },
  md: { width: 190, height: 72, className: "w-[160px] sm:w-[190px]" },
  lg: { width: 260, height: 98, className: "w-[210px] sm:w-[260px]" },
} as const;

/**
 * الشعار يتبع data-theme عبر CSS (بدون تأخير React/hydration).
 */
export function Logo({
  className,
  priority = false,
  size = "md",
  light = false,
}: LogoProps) {
  const s = sizes[size];

  if (light) {
    return (
      <Link
        href="/"
        className={cn("group inline-flex items-center justify-center", className)}
        aria-label="VELORA — Beauty Revealed"
      >
        <Image
          src="/brand/velora-logo-clear.png"
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

  return (
    <Link
      href="/"
      className={cn(
        "group relative inline-flex items-center justify-center",
        className,
      )}
      aria-label="VELORA — Beauty Revealed"
    >
      <Image
        src="/brand/velora-logo-dark.png"
        alt="VELORA Beauty Revealed"
        width={s.width}
        height={s.height}
        priority={priority}
        className={cn(
          "logo-mark-light h-auto transition-opacity duration-300 group-hover:opacity-85",
          s.className,
        )}
      />
      <Image
        src="/brand/velora-logo-clear.png"
        alt=""
        aria-hidden
        width={s.width}
        height={s.height}
        priority={priority}
        className={cn(
          "logo-mark-dark absolute inset-0 m-auto h-auto transition-opacity duration-300 group-hover:opacity-85",
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
