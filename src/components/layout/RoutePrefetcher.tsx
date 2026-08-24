"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PRIMARY_ROUTES = ["/", "/shop", "/search", "/advisor", "/account", "/login"] as const;

/**
 * يجهّز صفحات التنقل الأساسية مسبقاً على الجوال —
 * يقلّل انتظار RSC عند الضغط على الشريط السفلي.
 */
export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      for (const href of PRIMARY_ROUTES) {
        try {
          router.prefetch(href);
        } catch {
          /* ignore */
        }
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const t = window.setTimeout(run, 400);
    return () => window.clearTimeout(t);
  }, [router]);

  return null;
}
