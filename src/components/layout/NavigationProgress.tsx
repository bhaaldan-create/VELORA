"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * شريط تقدم خفيف أعلى الشاشة عند التنقل بين الصفحات.
 * يعطي إحساساً فورياً بالاستجابة بدل انتظار صامت.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const hideTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (href.startsWith("http") && !href.includes(window.location.origin)) {
        return;
      }
      const url = new URL(href, window.location.origin);
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (tickTimer.current) window.clearInterval(tickTimer.current);
      setActive(true);
      setWidth(12);
      tickTimer.current = window.setInterval(() => {
        setWidth((w) => {
          if (w >= 88) return w;
          return w + Math.max(1.5, (90 - w) * 0.08);
        });
      }, 120);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (tickTimer.current) window.clearInterval(tickTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    if (tickTimer.current) window.clearInterval(tickTimer.current);
    setWidth(100);
    hideTimer.current = window.setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 280);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- complete bar when route settles
  }, [routeKey]);

  if (!active && width === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
      aria-hidden
    >
      <div
        className="h-full bg-[var(--plum)] transition-[width] duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: active || width > 0 ? 1 : 0,
          boxShadow: "0 0 10px rgba(61,38,64,0.35)",
        }}
      />
    </div>
  );
}
