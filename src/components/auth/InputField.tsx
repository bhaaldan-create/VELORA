import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: string | null;
  wrapClassName?: string;
};

export function InputField({
  label,
  icon,
  hint,
  error,
  wrapClassName,
  id,
  ...props
}: InputFieldProps) {
  const inputId = id ?? label.replace(/\s/g, "-");

  return (
    <label className={cn("auth-field", wrapClassName)} htmlFor={inputId}>
      <span className="auth-label">{label}</span>
      <div className="auth-input-wrap">
        {icon ? <span className="auth-input-icon">{icon}</span> : null}
        <input id={inputId} className="auth-input" aria-invalid={Boolean(error)} {...props} />
      </div>
      {hint && !error ? (
        <span className="mt-1.5 block text-[0.8125rem] text-[var(--velora-mauve)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-1.5 block text-[0.8125rem] text-[var(--velora-error)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
