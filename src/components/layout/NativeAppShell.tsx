"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeLaunchExperience } from "@/components/layout/NativeLaunchExperience";

const NATIVE_VIEWPORT =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

function lockViewportMeta() {
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    document.head.appendChild(meta);
  }
  if (meta.getAttribute("content") !== NATIVE_VIEWPORT) {
    meta.setAttribute("content", NATIVE_VIEWPORT);
  }
  return meta;
}

/**
 * تهيئة طبقة الجوال عند التشغيل داخل تطبيق Capacitor.
 * شاشة الافتتاح تُدار مرة واحدة فقط عند الإقلاع — لا تُعاد عند التنقل.
 * يقفل تكبير WKWebView (focus zoom + pinch) جذرياً.
 */
export function NativeAppShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.dataset.native = Capacitor.getPlatform();

    let cancelled = false;
    const meta = lockViewportMeta();

    const viewportObserver = new MutationObserver(() => {
      if (cancelled) return;
      lockViewportMeta();
    });
    viewportObserver.observe(meta, {
      attributes: true,
      attributeFilter: ["content"],
    });

    const blockGesture = (event: Event) => {
      event.preventDefault();
    };
    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });

    /** إذا بقي الزوم عالقاً بعد إغلاق لوحة المفاتيح — أعد تثبيت المقياس */
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (cancelled) return;
        lockViewportMeta();
        const y = window.scrollY;
        window.scrollTo(0, y);
        requestAnimationFrame(() => {
          if (!cancelled) window.scrollTo(0, y);
        });
      }, 50);
    };
    document.addEventListener("focusout", onFocusOut, true);

    async function syncStatusBar() {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        const dark =
          document.documentElement.getAttribute("data-theme") === "dark";
        await StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark });
        await StatusBar.setBackgroundColor({
          color: dark ? "#141114" : "#F8F4F1",
        });
      } catch {
        // ignore
      }
    }

    void syncStatusBar();

    const onTheme = () => {
      void syncStatusBar();
    };
    document.documentElement.addEventListener("velora-theme-change", onTheme);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-theme") {
          void syncStatusBar();
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      viewportObserver.disconnect();
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
      document.removeEventListener("focusout", onFocusOut, true);
      document.documentElement.removeEventListener(
        "velora-theme-change",
        onTheme,
      );
      observer.disconnect();
    };
  }, []);

  return <NativeLaunchExperience />;
}
