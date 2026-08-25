"use client";

import { toPng } from "html-to-image";
import {
  MY_VELORA_CARD_HEIGHT,
  MY_VELORA_CARD_WIDTH,
} from "@/components/my-velora/VeloraSignatureCard";

async function waitForFonts() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Convert remote/same-origin images to data URLs so html-to-image never taints the canvas. */
async function inlineImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(src, { credentials: "same-origin", cache: "force-cache" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        img.removeAttribute("crossorigin");
        img.src = dataUrl;
      } catch {
        /* keep original src */
      }
    }),
  );
}

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          window.setTimeout(done, 4000);
        }),
    ),
  );
}

/**
 * Capture the official MY VELORA card at exact Instagram Story size: 1080×1920.
 * Uses an off-screen clone so scaled preview transforms never affect the export.
 */
export async function captureMyVeloraPng(): Promise<string> {
  const source = document.getElementById("velora-my-card");
  if (!source) {
    throw new Error(
      typeof navigator !== "undefined" && navigator.language?.startsWith("ar")
        ? "تعذّر العثور على بطاقة MY VELORA."
        : "Could not find MY VELORA card for export.",
    );
  }

  await waitForFonts();
  await waitForImages(source);
  await nextFrame();

  const host = document.createElement("div");
  host.setAttribute("data-my-velora-export-host", "true");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
    `width:${MY_VELORA_CARD_WIDTH}px`,
    `height:${MY_VELORA_CARD_HEIGHT}px`,
    "overflow:hidden",
    "margin:0",
    "padding:0",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.cssText = [
    `width:${MY_VELORA_CARD_WIDTH}px`,
    `height:${MY_VELORA_CARD_HEIGHT}px`,
    "max-width:none",
    "max-height:none",
    "margin:0",
    "transform:none",
    "overflow:hidden",
    "display:block",
    "position:relative",
  ].join(";");

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await inlineImages(clone);
    await waitForImages(clone);
    await nextFrame();
    await sleep(250);

    // Exact Story dimensions (not 2×) — Instagram expects 1080×1920.
    const dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio: 1,
      width: MY_VELORA_CARD_WIDTH,
      height: MY_VELORA_CARD_HEIGHT,
      canvasWidth: MY_VELORA_CARD_WIDTH,
      canvasHeight: MY_VELORA_CARD_HEIGHT,
      backgroundColor: "#E8DDF0",
      style: {
        margin: "0",
        transform: "none",
        transformOrigin: "top left",
        width: `${MY_VELORA_CARD_WIDTH}px`,
        height: `${MY_VELORA_CARD_HEIGHT}px`,
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return !node.dataset.exportHide;
      },
    });

    if (!dataUrl || dataUrl.length < 1000) {
      throw new Error("Empty export");
    }

    return dataUrl;
  } finally {
    host.remove();
  }
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadMyVeloraPng(orderId: string) {
  const dataUrl = await captureMyVeloraPng();
  triggerDownload(dataUrl, `MY-VELORA-${orderId}.png`);
  return dataUrl;
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
}

function isMobileUa() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Share the Story-sized PNG via the native share sheet.
 * On mobile this typically surfaces Instagram → Stories when the user picks Instagram.
 */
export async function shareMyVeloraToInstagramStories(input: {
  orderId: string;
  title: string;
  text: string;
}): Promise<"native-file" | "download-instagram" | "download"> {
  const dataUrl = await captureMyVeloraPng();
  const file = await dataUrlToFile(dataUrl, `MY-VELORA-${input.orderId}.png`);

  const fileShare = {
    files: [file],
    title: input.title,
    text: input.text,
  };

  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.(fileShare)
  ) {
    await navigator.share(fileShare);
    return "native-file";
  }

  // Fallback: save image, then open Instagram Stories camera when possible.
  triggerDownload(dataUrl, `MY-VELORA-${input.orderId}.png`);

  if (isMobileUa()) {
    window.setTimeout(() => {
      window.location.href = "instagram://story-camera";
    }, 400);
    return "download-instagram";
  }

  return "download";
}

export async function shareMyVeloraCard(payload: {
  title: string;
  text: string;
  url: string;
  orderId?: string;
}) {
  // Prefer sharing the actual Story image when we have an order id.
  if (payload.orderId) {
    try {
      const mode = await shareMyVeloraToInstagramStories({
        orderId: payload.orderId,
        title: payload.title,
        text: payload.text,
      });
      return mode;
    } catch {
      /* fall through to link share */
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
    return "native";
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(payload.url);
    return "clipboard";
  }
  return "unsupported";
}
