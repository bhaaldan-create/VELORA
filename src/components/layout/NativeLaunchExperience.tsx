"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const LAUNCH_ID = "velora-boot-launch";
const LAUNCH_DONE_KEY = "velora-launch-done";

function markLaunchDone() {
  try {
    sessionStorage.setItem(LAUNCH_DONE_KEY, "1");
  } catch {
    /* ignore */
  }
  try {
    (window as Window & { __VELORA_LAUNCH_DONE__?: boolean }).__VELORA_LAUNCH_DONE__ =
      true;
  } catch {
    /* ignore */
  }
}

function isLaunchDone(): boolean {
  try {
    if (
      (window as Window & { __VELORA_LAUNCH_DONE__?: boolean })
        .__VELORA_LAUNCH_DONE__
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  try {
    return sessionStorage.getItem(LAUNCH_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function removeLaunchOverlay() {
  const el = document.getElementById(LAUNCH_ID);
  if (el) el.remove();
  const root = document.documentElement;
  root.dataset.launch = "done";
}

/**
 * Cold-start launch only (Capacitor). Never re-arms on client navigations.
 */
export function NativeLaunchExperience() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      removeLaunchOverlay();
      delete document.documentElement.dataset.launch;
      return;
    }

    const root = document.documentElement;
    root.dataset.native = Capacitor.getPlatform();

    // Already shown this WebView session — never show again on route changes.
    if (isLaunchDone() || root.dataset.launch === "done") {
      markLaunchDone();
      removeLaunchOverlay();
      void import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 0 }))
        .catch(() => undefined);
      return;
    }

    // Only continue if boot script armed this cold start.
    if (root.dataset.launch !== "1") {
      markLaunchDone();
      removeLaunchOverlay();
      void import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 0 }))
        .catch(() => undefined);
      return;
    }

    const el = document.getElementById(LAUNCH_ID);
    if (!el) {
      markLaunchDone();
      root.dataset.launch = "done";
      void import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 0 }))
        .catch(() => undefined);
      return;
    }

    let cancelled = false;
    let exitTimer: number | undefined;
    let hideNativeTimer: number | undefined;
    let beatTimer: number | undefined;
    let finished = false;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      markLaunchDone();
      el.classList.add("velora-launch--exit");
      root.dataset.launch = "done";
      exitTimer = window.setTimeout(() => {
        if (!cancelled) removeLaunchOverlay();
      }, prefersReduced ? 120 : 280);
    };

    hideNativeTimer = window.setTimeout(() => {
      void (async () => {
        try {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          if (!cancelled) await SplashScreen.hide({ fadeOutDuration: 320 });
        } catch {
          /* ignore */
        }
      })();
    }, 30);

    const minBeatMs = prefersReduced ? 200 : 900;
    const maxMs = prefersReduced ? 600 : 2800;
    const started = performance.now();

    const tryExit = () => {
      if (cancelled || finished) return;
      const elapsed = performance.now() - started;
      if (elapsed < minBeatMs) {
        beatTimer = window.setTimeout(tryExit, minBeatMs - elapsed);
        return;
      }
      finish();
    };

    const onReady = () => tryExit();

    if (document.readyState === "complete") {
      tryExit();
    } else {
      window.addEventListener("load", onReady, { once: true });
      requestAnimationFrame(() => requestAnimationFrame(onReady));
    }

    const hardCap = window.setTimeout(finish, maxMs);

    return () => {
      cancelled = true;
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideNativeTimer);
      window.clearTimeout(beatTimer);
      window.clearTimeout(hardCap);
      window.removeEventListener("load", onReady);
    };
  }, []);

  return null;
}
