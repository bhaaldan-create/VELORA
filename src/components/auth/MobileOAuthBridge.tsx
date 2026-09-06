"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import {
  mobileOAuthCompleteUrl,
  parseMobileOAuthAppUrl,
  parseMobileOAuthErrorUrl,
  VELORA_OAUTH_RETURN_EVENT,
  isCapacitorWebView,
} from "@/lib/oauth-mobile-bridge";

const HANDLED_KEY = "velora-oauth-deeplink-handled";

function readHandled(): string | null {
  try {
    return sessionStorage.getItem(HANDLED_KEY);
  } catch {
    return null;
  }
}

function writeHandled(id: string) {
  try {
    sessionStorage.setItem(HANDLED_KEY, id);
  } catch {
    /* ignore */
  }
}

/**
 * يستقبل deep link بعد OAuth مرة واحدة فقط لكل تذكرة —
 * لا يعيد معالجة getLaunchUrl بعد كل تحميل للصفحة (يمنع حلقة الوميض).
 */
export function MobileOAuthBridge() {
  const handledRef = useRef<string | null>(readHandled());

  useEffect(() => {
    const native =
      (() => {
        try {
          return Capacitor.isNativePlatform();
        } catch {
          return false;
        }
      })() || isCapacitorWebView();
    if (!native) return;

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

    function notifyReturn() {
      try {
        window.dispatchEvent(new Event(VELORA_OAUTH_RETURN_EVENT));
      } catch {
        /* ignore */
      }
    }

    function claim(id: string): boolean {
      if (!id) return false;
      if (handledRef.current === id || readHandled() === id) return false;
      handledRef.current = id;
      writeHandled(id);
      return true;
    }

    function handle(rawUrl: string) {
      if (!rawUrl) return;

      const error = parseMobileOAuthErrorUrl(rawUrl);
      if (error) {
        const id = `err:${rawUrl}`;
        if (!claim(id)) return;
        notifyReturn();
        void closeBrowser();
        const params = new URLSearchParams({
          oauth_error: error.message,
          next: error.next,
        });
        window.location.replace(`/login?${params.toString()}`);
        return;
      }

      const parsed = parseMobileOAuthAppUrl(rawUrl);
      if (!parsed) return;

      // Key by ticket — survives remounts; stops getLaunchUrl replay loop
      const id = `ticket:${parsed.ticket}`;
      if (!claim(id)) return;

      notifyReturn();
      void closeBrowser();
      window.location.replace(
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

        // Cold start only — skip if this ticket was already consumed
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
