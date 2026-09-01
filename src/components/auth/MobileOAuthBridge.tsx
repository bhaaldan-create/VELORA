"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  mobileOAuthCompleteUrl,
  parseMobileOAuthAppUrl,
} from "@/lib/oauth-mobile-bridge";

/**
 * يستقبل deep link بعد OAuth في متصفح النظام
 * وينقل الجلسة إلى WebView داخل التطبيق.
 */
export function MobileOAuthBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removed = false;
    let listener: { remove: () => void } | undefined;

    function handle(rawUrl: string) {
      const parsed = parseMobileOAuthAppUrl(rawUrl);
      if (!parsed) return;
      window.location.assign(
        mobileOAuthCompleteUrl(parsed.ticket, parsed.next),
      );
    }

    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        if (removed) return;

        listener = await App.addListener("appUrlOpen", ({ url }) => {
          handle(url);
        });

        const launch = await App.getLaunchUrl();
        if (launch?.url) handle(launch.url);
      } catch {
        /* web or plugin unavailable */
      }
    })();

    return () => {
      removed = true;
      listener?.remove();
    };
  }, []);

  return null;
}
