"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * تهيئة طبقة الجوال عند التشغيل داخل تطبيق Capacitor.
 */
export function NativeAppShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.dataset.native = Capacitor.getPlatform();

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const dark =
          document.documentElement.getAttribute("data-theme") === "dark";
        await StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark });
        await StatusBar.setBackgroundColor({
          color: dark ? "#141114" : "#F8F4F1",
        });
      } catch {
        // ignore — web or unsupported
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}
