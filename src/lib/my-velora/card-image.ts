"use client";

import { toPng } from "html-to-image";
import {
  MY_VELORA_CARD_HEIGHT,
  MY_VELORA_CARD_WIDTH,
  MY_VELORA_MASTER_BG,
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

export async function urlToDataUrl(src: string): Promise<string | null> {
  try {
    const absolute = src.startsWith("http")
      ? src
      : new URL(src, window.location.origin).toString();
    const res = await fetch(absolute, {
      credentials: "same-origin",
      cache: "no-cache",
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function inlineAllImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const dataUrl = await urlToDataUrl(src);
      if (!dataUrl) return;
      img.removeAttribute("crossorigin");
      img.src = dataUrl;
    }),
  );

  // Also inline CSS background-image on the card root
  const bg = root.style.backgroundImage;
  const match = bg?.match(/url\(["']?(.+?)["']?\)/);
  if (match?.[1] && !match[1].startsWith("data:")) {
    const dataUrl = await urlToDataUrl(match[1]);
    if (dataUrl) {
      root.style.backgroundImage = `url("${dataUrl}")`;
    }
  }
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
          window.setTimeout(done, 5000);
        }),
    ),
  );
}

/**
 * Capture MY VELORA card at exact 1080×1920.
 * IMPORTANT: never use opacity:0 on the capture host — html-to-image skips painting it.
 */
export async function captureMyVeloraPng(): Promise<string> {
  const source = document.getElementById("velora-my-card");
  if (!source) {
    throw new Error("تعذّر العثور على بطاقة MY VELORA.");
  }

  await waitForFonts();
  await waitForImages(source);
  await nextFrame();

  // Preload master template to data URL for reliability
  const masterData = await urlToDataUrl(MY_VELORA_MASTER_BG);

  const host = document.createElement("div");
  host.setAttribute("data-my-velora-export-host", "true");
  // Visible to the renderer, but off-screen (opacity:0 breaks capture on mobile Safari).
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    "opacity:1",
    "visibility:visible",
    "pointer-events:none",
    "z-index:0",
    `width:${MY_VELORA_CARD_WIDTH}px`,
    `height:${MY_VELORA_CARD_HEIGHT}px`,
    "overflow:hidden",
    "margin:0",
    "padding:0",
    "background:#E8DDF0",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.cssText = [
    `width:${MY_VELORA_CARD_WIDTH}px`,
    `height:${MY_VELORA_CARD_HEIGHT}px`,
    "max-width:none",
    "max-height:none",
    "margin:0",
    "padding:0",
    "transform:none",
    "overflow:hidden",
    "display:block",
    "position:relative",
    "background-color:#E8DDF0",
    masterData
      ? `background-image:url("${masterData}")`
      : `background-image:url("${MY_VELORA_MASTER_BG}")`,
    "background-repeat:no-repeat",
    "background-position:center center",
    "background-size:100% 100%",
  ].join(";");

  // Ensure nested master <img> also uses data URL
  const bgImg = clone.querySelector("img[data-mv-bg]") as HTMLImageElement | null;
  if (bgImg && masterData) {
    bgImg.src = masterData;
  }

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await inlineAllImages(clone);
    await waitForImages(clone);
    await nextFrame();
    await sleep(400);

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
        padding: "0",
        transform: "none",
        transformOrigin: "top left",
        width: `${MY_VELORA_CARD_WIDTH}px`,
        height: `${MY_VELORA_CARD_HEIGHT}px`,
        opacity: "1",
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return !node.dataset.exportHide;
      },
    });

    if (!dataUrl || dataUrl.length < 5000) {
      throw new Error("تعذّر إنشاء صورة البطاقة. أعيدي المحاولة.");
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
  if (payload.orderId) {
    try {
      return await shareMyVeloraToInstagramStories({
        orderId: payload.orderId,
        title: payload.title,
        text: payload.text,
      });
    } catch {
      /* fall through */
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
