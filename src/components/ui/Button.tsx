import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--btn-bg)] text-[var(--btn-fg)] hover:bg-[var(--btn-bg-hover)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]",
  secondary:
    "bg-[var(--champagne)] text-[var(--ink)] hover:bg-[var(--mist)]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--mist)]",
  outline:
    "bg-transparent text-[var(--plum)] border border-[var(--plum)]/25 hover:border-[var(--plum)]/50 hover:bg-[var(--plum)]/[0.04]",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "t2 inline-flex items-center justify-center gap-2 px-6 py-3 font-medium tracking-[0.06em] transition-all duration-300 disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
