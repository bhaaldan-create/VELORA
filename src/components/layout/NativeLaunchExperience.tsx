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

/**
 * Hide launch via attributes/CSS only.
 * Never remove #velora-boot-launch from the DOM — React owns that node in the
 * root layout; manual remove() breaks soft navigations ("This page couldn’t load").
 */
function hideLaunchOverlay() {
  const root = document.documentElement;
  root.dataset.launch = "done";
  const el = document.getElementById(LAUNCH_ID);
  if (el) {
    el.classList.add("velora-launch--exit");
    el.setAttribute("aria-hidden", "true");
  }
}

async function hideNativeSplash(fadeOutDuration = 0) {
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration });
  } catch {
    /* ignore */
  }
}

/**
 * Cold-start launch only (Capacitor). Never re-arms on client navigations.
 */
export function NativeLaunchExperience() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      hideLaunchOverlay();
      delete document.documentElement.dataset.launch;
      return;
    }

    const root = document.documentElement;
    root.dataset.native = Capacitor.getPlatform();

    // Already shown this WebView session — never show again on route changes.
    if (isLaunchDone() || root.dataset.launch === "done") {
      markLaunchDone();
      hideLaunchOverlay();
      void hideNativeSplash(0);
      return;
    }

    // Only continue if boot script armed this cold start.
    if (root.dataset.launch !== "1") {
      markLaunchDone();
      hideLaunchOverlay();
      void hideNativeSplash(0);
      return;
    }

    const el = document.getElementById(LAUNCH_ID);
    if (!el) {
      markLaunchDone();
      root.dataset.launch = "done";
      void hideNativeSplash(0);
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
      // Keep the node in the tree; CSS hides it when data-launch !== "1".
      exitTimer = window.setTimeout(() => {
        if (!cancelled) hideLaunchOverlay();
      }, prefersReduced ? 120 : 280);
    };

    hideNativeTimer = window.setTimeout(() => {
      void hideNativeSplash(320);
    }, 30);

    const minBeatMs = prefersReduced ? 200 : 1400;
    const maxMs = prefersReduced ? 500 : 2000;
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
