"use client";

import { ChevronDown, Globe } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { authCopy } from "@/components/auth/auth-copy";
import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function AuthHeader({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const copy = authCopy(locale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  function pick(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <header
      className={cn(
        "relative z-10 flex items-center justify-between px-5 py-4 sm:px-8",
        className,
      )}
    >
      <Logo size="sm" priority />
      <div ref={rootRef} className="relative">
        <button
          type="button"
          className="auth-lang-btn"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((v) => !v)}
        >
          <Globe size={15} aria-hidden />
          <span>{copy.language}</span>
          <ChevronDown
            size={14}
            className={cn("transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {open ? (
          <ul
            role="listbox"
            className="absolute end-0 top-[calc(100%+0.35rem)] min-w-[9rem] overflow-hidden rounded-xl border border-[var(--velora-border)] bg-white py-1 shadow-[var(--velora-shadow-soft)]"
          >
            <li>
              <button
                type="button"
                role="option"
                aria-selected={locale === "ar"}
                className={cn(
                  "block w-full px-4 py-2.5 text-start text-sm transition-colors hover:bg-[var(--velora-blush)]",
                  locale === "ar" && "font-medium text-[var(--velora-plum)]",
                )}
                onClick={() => pick("ar")}
              >
                العربية
              </button>
            </li>
            <li>
              <button
                type="button"
                role="option"
                aria-selected={locale === "en"}
                className={cn(
                  "block w-full px-4 py-2.5 text-start text-sm transition-colors hover:bg-[var(--velora-blush)]",
                  locale === "en" && "font-medium text-[var(--velora-plum)]",
                )}
                onClick={() => pick("en")}
              >
                English
              </button>
            </li>
          </ul>
        ) : null}
      </div>
    </header>
  );
}
