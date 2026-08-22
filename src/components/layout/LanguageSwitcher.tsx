"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FlagIraq, FlagUSA } from "@/components/layout/FlagIcons";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

const options: {
  code: Locale;
  short: string;
  Flag: typeof FlagIraq;
}[] = [
  { code: "ar", short: "AR", Flag: FlagIraq },
  { code: "en", short: "EN", Flag: FlagUSA },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = options.find((o) => o.code === locale) ?? options[0];
  const CurrentFlag = current.Flag;

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
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "group inline-flex items-center gap-2 rounded-md px-2 py-1.5",
          "text-[12px] font-semibold tracking-[0.12em] text-[var(--ink)]/80",
          "transition-all duration-300",
          "hover:bg-[var(--plum)]/[0.06] hover:text-[var(--plum)]",
          open && "bg-[var(--plum)]/[0.06] text-[var(--plum)]",
        )}
        aria-label={t.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(26,18,28,0.08)]">
          <CurrentFlag className="h-[14px] w-[21px]" />
        </span>
        <span>{current.short}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={cn(
            "text-[var(--ink)]/40 transition-transform duration-300",
            open && "rotate-180 text-[var(--plum)]/60",
          )}
          aria-hidden
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={cn(
          "absolute end-0 top-[calc(100%+10px)] z-[60] origin-top-end",
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
          className="min-w-[9.5rem] overflow-hidden rounded-xl border border-[var(--plum)]/10 bg-[var(--background)]/95 p-1.5 shadow-[0_18px_40px_rgba(26,18,28,0.14)] backdrop-blur-md"
        >
          {options.map((option) => {
            const active = locale === option.code;
            const Flag = option.Flag;
            return (
              <li key={option.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start",
                    "text-[12px] font-semibold tracking-[0.12em] transition-colors duration-200",
                    active
                      ? "bg-[var(--plum)] text-[var(--btn-fg)]"
                      : "text-[var(--ink)]/75 hover:bg-[var(--mist)] hover:text-[var(--plum)]",
                  )}
                  onClick={() => {
                    setLocale(option.code);
                    setOpen(false);
                  }}
                >
                  <span
                    className={cn(
                      "relative overflow-hidden rounded-[3px]",
                      active
                        ? "shadow-[0_0_0_1px_rgba(255,255,255,0.25)]"
                        : "shadow-[0_0_0_1px_rgba(26,18,28,0.08)]",
                    )}
                  >
                    <Flag className="h-[14px] w-[21px]" />
                  </span>
                  <span>{option.short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
