"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { LarsaMark } from "@/components/advisor/LarsaIcons";

export function LarsaAvatar({
  size = "md",
  active = false,
  thinking = false,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  thinking?: boolean;
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "h-16 w-16 sm:h-[72px] sm:w-[72px]"
      : size === "md"
        ? "h-[88px] w-[88px] sm:h-[110px] sm:w-[110px]"
        : size === "lg"
          ? "h-[140px] w-[140px] sm:h-[180px] sm:w-[180px]"
          : "h-[160px] w-[160px] sm:h-[210px] sm:w-[210px]";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-[-18%] rounded-full",
          (active || thinking) &&
            "motion-safe:animate-[larsa-halo_3.2s_ease-in-out_infinite]",
        )}
        style={{
          background:
            "radial-gradient(circle, rgba(243,237,245,0.95) 0%, rgba(232,221,235,0.45) 40%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-[var(--larsa-lavender)] ring-1 ring-[var(--larsa-lavender-deep)]",
          dim,
        )}
      >
        <Image
          src="/brand/larsa-portrait.png"
          alt="لارسا"
          fill
          priority={size === "lg" || size === "xl"}
          className="object-cover object-[center_18%]"
          sizes="(max-width: 640px) 140px, 220px"
        />
      </div>
      {thinking ? (
        <span className="absolute -bottom-1 -start-1 rounded-full bg-white p-1 shadow-[0_4px_16px_rgba(58,24,54,0.08)] ring-1 ring-[var(--larsa-border)]">
          <LarsaMark size={22} spinning />
        </span>
      ) : null}
    </div>
  );
}
