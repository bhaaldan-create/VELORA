"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  autoFocus?: boolean;
};

export function OTPInput({
  value,
  onChange,
  disabled,
  length = 6,
  autoFocus,
}: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const cells = useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = useCallback(
    (index: number, char: string) => {
      const next = [...cells];
      next[index] = char;
      onChange(next.join("").slice(0, length));
      if (char && index < length - 1) {
        refs.current[index + 1]?.focus();
      }
    },
    [cells, length, onChange],
  );

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (cells[index]) {
        setAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1)
      refs.current[index + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (pasted) onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="auth-otp-grid" role="group" aria-label="Verification code">
      {cells.map((cell, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={cell}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className="auth-otp-cell"
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, char);
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
