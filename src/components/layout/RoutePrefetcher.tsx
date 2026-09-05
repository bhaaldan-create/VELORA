"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const IMMEDIATE = ["/", "/shop"] as const;
const DEFERRED = ["/search", "/advisor", "/account", "/login"] as const;

/**
 * Prefetch hot tab routes after first paint — avoid fighting LCP bandwidth.
 */
export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const warm = (hrefs: readonly string[]) => {
      for (const href of hrefs) {
        try {
          router.prefetch(href);
        } catch {
          /* ignore */
        }
      }
    };

    let idleId: number | undefined;
    let deferredTimer: number | undefined;
    let immediateTimer: number | undefined;

    const scheduleImmediate = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => warm(IMMEDIATE), {
          timeout: 1800,
        });
      } else {
        immediateTimer = window.setTimeout(() => warm(IMMEDIATE), 600);
      }
    };

    const onLoad = () => {
      deferredTimer = window.setTimeout(() => warm(DEFERRED), 2500);
    };

    scheduleImmediate();

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(immediateTimer);
      window.clearTimeout(deferredTimer);
      window.removeEventListener("load", onLoad);
    };
  }, [router]);

  return null;
}
