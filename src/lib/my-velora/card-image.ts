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

export async function downloadMyVeloraPng(orderId: string) {
  const source = document.getElementById("velora-my-card");
  if (!source) {
    throw new Error("Could not find MY VELORA card for export.");
  }

  await waitForFonts();
  await nextFrame();
  await new Promise((r) => setTimeout(r, 600));

  const host = document.createElement("div");
  host.setAttribute("data-my-velora-export-host", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-16000px",
    "top:0",
    `width:${MY_VELORA_CARD_WIDTH}px`,
    `height:${MY_VELORA_CARD_HEIGHT}px`,
    "padding:0",
    "margin:0",
    "overflow:visible",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.cssText = [
    `width:${MY_VELORA_CARD_WIDTH}px`,
    `height:${MY_VELORA_CARD_HEIGHT}px`,
    "margin:0",
    "transform:none",
    "overflow:hidden",
    "display:block",
  ].join(";");

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await nextFrame();
    await new Promise((r) => setTimeout(r, 300));

    const pixelRatio = 2;
    const dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio,
      width: MY_VELORA_CARD_WIDTH,
      height: MY_VELORA_CARD_HEIGHT,
      canvasWidth: MY_VELORA_CARD_WIDTH * pixelRatio,
      canvasHeight: MY_VELORA_CARD_HEIGHT * pixelRatio,
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

    const link = document.createElement("a");
    link.download = `MY-VELORA-${orderId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();

    return dataUrl;
  } finally {
    host.remove();
  }
}

export async function shareMyVeloraCard(payload: {
  title: string;
  text: string;
  url: string;
}) {
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share(payload);
    return "native";
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(payload.url);
    return "clipboard";
  }
  return "unsupported";
}
