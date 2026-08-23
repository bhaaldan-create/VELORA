"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  hint?: string;
  error?: string | null;
  id?: string;
};

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  disabled,
  hint,
  error,
  id,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const inputId = id ?? "auth-password";

  return (
    <label className="auth-field" htmlFor={inputId}>
      <span className="auth-label">{label}</span>
      <div className="auth-input-wrap">
        <span className="auth-input-icon">
          <Lock size={18} aria-hidden />
        </span>
        <input
          id={inputId}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          dir="ltr"
          className="auth-input pe-12"
        />
        <button
          type="button"
          className="auth-input-action"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
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
