"use client";

import { toPng } from "html-to-image";

/** عرض الوصل عند التصدير — يطابق مقاس القالب تقريباً */
export const RECEIPT_EXPORT_WIDTH = 850;

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

/**
 * يلتقط الوصل كاملاً بأبعاده الصحيحة عبر نسخة ثابتة خارج الشاشة
 * (يتجنب قصّ المحتوى بسبب max-width / overflow / viewport).
 */
export async function downloadReceiptPng(orderId: string) {
  const source = document.getElementById("velora-receipt");
  if (!source) {
    throw new Error("تعذّر العثور على الوصل لإنشاء الصورة.");
  }

  await waitForFonts();
  await nextFrame();
  // انتظار قصير لاكتمال التخطيط والخطوط
  await new Promise((r) => setTimeout(r, 500));

  const host = document.createElement("div");
  host.setAttribute("data-receipt-export-host", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-14000px",
    "top:0",
    "width:" + RECEIPT_EXPORT_WIDTH + "px",
    "padding:0",
    "margin:0",
    "background:#ffffff",
    "overflow:visible",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.cssText = [
    "width:" + RECEIPT_EXPORT_WIDTH + "px",
    "max-width:" + RECEIPT_EXPORT_WIDTH + "px",
    "min-width:" + RECEIPT_EXPORT_WIDTH + "px",
    "margin:0",
    "box-sizing:border-box",
    "transform:none",
    "background:#ffffff",
    "overflow:visible",
    "display:block",
  ].join(";");

  // إزالة قيود العرض من Tailwind على النسخة
  clone.classList.remove("max-w-[720px]", "mx-auto", "w-full");
  clone.classList.add("receipt-export-clone");

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await nextFrame();
    await new Promise((r) => setTimeout(r, 200));

    const width = RECEIPT_EXPORT_WIDTH;
    const height = Math.max(
      Math.ceil(clone.scrollHeight),
      Math.ceil(clone.getBoundingClientRect().height),
      Math.ceil(clone.offsetHeight),
    );

    // ثبّت الارتفاع الصريح قبل الالتقاط حتى لا يُقصّ الذيل
    clone.style.height = `${height}px`;
    clone.style.minHeight = `${height}px`;
    host.style.height = `${height}px`;

    await nextFrame();

    const pixelRatio = 2;
    const dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio,
      backgroundColor: "#ffffff",
      width,
      height,
      canvasWidth: Math.round(width * pixelRatio),
      canvasHeight: Math.round(height * pixelRatio),
      style: {
        margin: "0",
        transform: "none",
        transformOrigin: "top left",
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: `${width}px`,
        boxSizing: "border-box",
        overflow: "visible",
        background: "#ffffff",
      },
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        // لا تُدرج عناصر التحكم أو التلميحات
        return !node.classList.contains("print:hidden");
      },
    });

    const link = document.createElement("a");
    link.download = `VELORA-Receipt-${orderId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();

    return dataUrl;
  } finally {
    host.remove();
  }
}
