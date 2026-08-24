"use client";

import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";

export function WishlistHeartButton({
  productId,
  className,
  size = "md",
}: {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { has, toggle, pending } = useWishlist();
  const wished = has(productId);
  const busy = pending(productId);

  return (
    <button
      type="button"
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wished}
      aria-busy={busy}
      disabled={busy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        void toggle(productId);
      }}
      className={cn(
        "z-10 flex items-center justify-center text-[var(--ink)]/45 transition-colors duration-200 hover:text-[var(--plum)]",
        "active:scale-95 disabled:opacity-70",
        wished && "text-[var(--plum)]",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
    >
      <svg
        width={size === "sm" ? 16 : 18}
        height={size === "sm" ? 16 : 18}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={cn(
          "transition-transform duration-200 ease-out",
          wished && "scale-105",
          busy && "animate-pulse",
        )}
      >
        <path
          d="M12 20s-7-4.35-7-9.2A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7 3.7C19 15.65 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill={wished ? "currentColor" : "none"}
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
