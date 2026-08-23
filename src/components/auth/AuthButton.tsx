import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  trailing?: ReactNode;
};

export function AuthButton({
  children,
  loading,
  trailing,
  disabled,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      type="submit"
      className={cn("auth-btn", className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="auth-btn-spinner" aria-hidden />
      ) : (
        <>
          <span>{children}</span>
          {trailing}
        </>
      )}
    </button>
  );
}
