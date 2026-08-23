import Image from "next/image";
import { cn } from "@/lib/utils";

type ClubLogoProps = {
  className?: string;
  /** Visual height in px for the logo art */
  height?: number;
  priority?: boolean;
};

/**
 * Official VELORA CLUB wordmark — transparent PNG, proportions preserved.
 */
export function ClubLogo({
  className,
  height = 56,
  priority,
}: ClubLogoProps) {
  const width = Math.round(height * (1200 / 700));
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{ height, width: Math.min(width, height * 2.1) }}
    >
      <Image
        src="/brand/velora-club-logo.png"
        alt="VELORA CLUB — Beauty Revealed"
        width={width}
        height={height}
        priority={priority}
        className="h-full w-auto max-w-none object-contain object-center"
        sizes={`${Math.min(width, height * 2.1)}px`}
      />
    </span>
  );
}
