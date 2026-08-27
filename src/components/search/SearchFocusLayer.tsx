"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  ar?: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Search focus layer — body portal + scroll lock.
 * Intentionally avoids history.pushState (Strict Mode remounts caused open/close loops).
 */
export function SearchFocusLayer({
  open,
  ar = false,
  onClose,
  children,
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
      htmlOverflow: html.style.overflow,
    };

    const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    if (scrollbarGap > 0) body.style.paddingRight = `${scrollbarGap}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    const t = window.setTimeout(() => {
      const input = panelRef.current?.querySelector<HTMLInputElement>(
        "input[type='search'], input:not([type]), input[type='text']",
      );
      input?.focus({ preventScroll: true });
    }, 40);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.paddingRight = prev.paddingRight;
      html.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, scrollY);
      // Do NOT restore focus to the idle search input — that re-opens the layer.
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    };
  }, [open, onClose, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="vs-focus"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="vs-focus__backdrop"
        aria-label={ar ? "إغلاق البحث" : "Close search"}
        tabIndex={-1}
        onClick={onClose}
      />

      <div ref={panelRef} className="vs-focus__panel">
        <h2 id={titleId} className="sr-only">
          {ar ? "بحث VELORA" : "VELORA Search"}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
