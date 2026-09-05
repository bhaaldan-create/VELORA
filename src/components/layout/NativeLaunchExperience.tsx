"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const LAUNCH_ID = "velora-boot-launch";

/**
 * Orchestrates the server-rendered launch overlay on Capacitor:
 * hide native splash → wait until interactive → fade out.
 * Visual lives in VeloraBootLaunch (HTML first paint — no white gap).
 */
export function NativeLaunchExperience() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      const orphan = document.getElementById(LAUNCH_ID);
      if (orphan) orphan.remove();
      delete document.documentElement.dataset.launch;
      return;
    }

    const root = document.documentElement;
    root.dataset.native = Capacitor.getPlatform();

    const alreadyArmed = root.dataset.launch === "1";
    const tooLate =
      !alreadyArmed &&
      document.readyState === "complete" &&
      performance.now() > 1800;

    let cancelled = false;
    let exitTimer: number | undefined;
    let hideNativeTimer: number | undefined;
    let beatTimer: number | undefined;
    let finished = false;

    const hideNativeSplash = () => {
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
    };

    if (tooLate) {
      hideNativeSplash();
      const el = document.getElementById(LAUNCH_ID);
      if (el) el.remove();
      delete root.dataset.launch;
      return () => {
        cancelled = true;
        window.clearTimeout(hideNativeTimer);
      };
    }

    root.dataset.launch = "1";
    const el = document.getElementById(LAUNCH_ID);
    if (!el) {
      hideNativeSplash();
      return;
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      el.classList.add("velora-launch--exit");
      root.dataset.launch = "0";
      exitTimer = window.setTimeout(() => {
        if (!cancelled) {
          el.remove();
          delete root.dataset.launch;
        }
      }, prefersReduced ? 160 : 480);
    };

    hideNativeSplash();

    const minBeatMs = prefersReduced ? 200 : 720;
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
