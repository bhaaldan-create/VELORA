"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import {
  mobileOAuthCompleteUrl,
  parseMobileOAuthAppUrl,
  parseMobileOAuthErrorUrl,
} from "@/lib/oauth-mobile-bridge";

/**
 * يستقبل deep link بعد OAuth في متصفح النظام
 * وينقل الجلسة إلى WebView داخل التطبيق.
 */
export function MobileOAuthBridge() {
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removed = false;
    let listener: { remove: () => Promise<void> | void } | undefined;

    async function closeBrowser() {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.close();
      } catch {
        /* ignore */
      }
    }

    function handle(rawUrl: string) {
      if (!rawUrl || handledRef.current === rawUrl) return;

      const error = parseMobileOAuthErrorUrl(rawUrl);
      if (error) {
        handledRef.current = rawUrl;
        void closeBrowser();
        const params = new URLSearchParams({
          oauth_error: error.message,
          next: error.next,
        });
        window.location.assign(`/login?${params.toString()}`);
        return;
      }

      const parsed = parseMobileOAuthAppUrl(rawUrl);
      if (!parsed) return;

      handledRef.current = rawUrl;
      void closeBrowser();
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
      void listener?.remove();
    };
  }, []);

  return null;
}
