"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

const options: { code: Locale; label: string }[] = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];

/** يطابق أزرار الهيدر: h-9، rounded-full، stroke 1.5 */
const triggerClass =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-[var(--ink)]/70 transition-colors hover:bg-[var(--mist)] hover:text-[var(--plum)]";

function IconGlobe() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 3c2.8 3.1 2.8 14.9 0 18M12 3c-2.8 3.1-2.8 14.9 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="7"
      height="7"
      viewBox="0 0 10 10"
      className={className}
      aria-hidden
    >
      <path
        d="M2 3.5 5 6.5 8 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = options.find((o) => o.code === locale) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        className={cn(triggerClass, open && "bg-[var(--mist)] text-[var(--plum)]")}
        aria-label={t.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {/* أفقي: كوكب + سهم (عمودي صغير) | اسم اللغة */}
        <span className="flex flex-col items-center justify-center gap-0 leading-none">
          <IconGlobe />
          <IconChevronDown
            className={cn(
              "-mt-0.5 text-[var(--ink)]/45 transition-transform duration-300",
              open && "rotate-180 text-[var(--plum)]/70",
            )}
          />
        </span>
        <span className="text-[10px] font-medium leading-tight whitespace-nowrap">
          {current.label}
        </span>
      </button>

      {/* قائمة عمودية — تبقى داخل الشاشة */}
      <div
        className={cn(
          "absolute start-0 top-[calc(100%+8px)] z-[60] origin-top-start",
          "transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
        )}
      >
        <ul
          id={menuId}
          role="listbox"
          aria-label={t.language}
          className="w-[9.5rem] overflow-hidden rounded-xl border border-[var(--plum)]/10 bg-[var(--background)]/95 p-1.5 shadow-[0_18px_40px_rgba(26,18,28,0.14)] backdrop-blur-md"
        >
          {options.map((option) => {
            const active = locale === option.code;
            return (
              <li key={option.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2.5 text-start",
                    "text-[12px] font-medium transition-colors duration-200",
                    active
                      ? "bg-[var(--plum)] text-[var(--btn-fg)]"
                      : "text-[var(--ink)]/75 hover:bg-[var(--mist)] hover:text-[var(--plum)]",
                  )}
                  onClick={() => {
                    setLocale(option.code);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
