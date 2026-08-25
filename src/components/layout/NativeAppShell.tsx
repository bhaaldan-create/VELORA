"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * تهيئة طبقة الجوال عند التشغيل داخل تطبيق Capacitor.
 * يتابع تغيّر الثيم ليحدّث شريط الحالة فوراً.
 */
export function NativeAppShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.dataset.native = Capacitor.getPlatform();

    let cancelled = false;

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
        // ignore — web or unsupported
      }
    }

    void (async () => {
      await syncStatusBar();
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        if (!cancelled) await SplashScreen.hide();
      } catch {
        // ignore
      }
    })();

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
      document.documentElement.removeEventListener(
        "velora-theme-change",
        onTheme,
      );
      observer.disconnect();
    };
  }, []);

  return null;
}
