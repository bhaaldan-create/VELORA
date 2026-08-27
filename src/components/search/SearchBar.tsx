"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  onFocus?: () => void;
  onPointerDown?: () => void;
  placeholder: string;
  ar?: boolean;
  autoFocus?: boolean;
  /** When true, renders as the primary control inside SearchFocusLayer */
  elevated?: boolean;
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  onFocus,
  onPointerDown,
  placeholder,
  ar = false,
  autoFocus = false,
  elevated = false,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  return (
    <form
      className={elevated ? "vs-searchbar vs-searchbar--elevated" : "vs-searchbar"}
      role="search"
      onPointerDown={() => onPointerDown?.()}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <span className="vs-searchbar__icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <label htmlFor={id} className="sr-only">
        {ar ? "بحث" : "Search"}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        autoCorrect="off"
        spellCheck={false}
      />
      {value ? (
        <button
          type="button"
          className="vs-searchbar__clear"
          onClick={() => {
            onChange("");
            onClear?.();
            inputRef.current?.focus({ preventScroll: true });
          }}
        >
          {ar ? "مسح" : "Clear"}
        </button>
      ) : null}
    </form>
  );
}
