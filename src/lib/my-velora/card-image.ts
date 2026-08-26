"use client";

/**
 * Client helpers for the SERVER-rendered MY VELORA Story PNG.
 */

function imageUrl(orderId: string, opts?: { download?: boolean; bust?: number }) {
  const q = new URLSearchParams();
  q.set("locale", "en");
  if (opts?.download) q.set("download", "1");
  if (opts?.bust) q.set("t", String(opts.bust));
  return `/api/auth/my-velora/${encodeURIComponent(orderId)}/image?${q.toString()}`;
}

export async function fetchMyVeloraCardBlob(orderId: string): Promise<Blob> {
  const res = await fetch(imageUrl(orderId, { bust: Date.now() }), {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).trim();
    if (res.status === 401) {
      throw new Error("يجب تسجيل الدخول أولاً.");
    }
    if (res.status === 404) {
      throw new Error("الطلب غير مؤهل لبطاقة MY VELORA.");
    }
    const detail = text
      .replace(/^Render failed:\s*/i, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 180)
      .trim();
    if (detail.startsWith("<!DOCTYPE") || detail.includes("__next_error__")) {
      throw new Error(
        `تعذّر تجهيز البطاقة (${res.status}): خطأ داخلي في الخادم. أعيدي المحاولة بعد لحظات.`,
      );
    }
    throw new Error(
      detail
        ? `تعذّر تجهيز البطاقة (${res.status}): ${detail}`
        : `تعذّر تجهيز البطاقة من الخادم (${res.status}).`,
    );
  }
  const type = res.headers.get("content-type") || "";
  if (!type.includes("image/")) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "استجابة غير صالحة من الخادم.");
  }
  return res.blob();
}

export function getMyVeloraImageSrc(orderId: string, bust?: number) {
  return imageUrl(orderId, { bust });
}

export async function downloadMyVeloraPng(orderId: string) {
  const blob = await fetchMyVeloraCardBlob(orderId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `MY-VELORA-${orderId}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return url;
}

export async function shareMyVeloraToInstagramStories(input: {
  orderId: string;
  title: string;
  text: string;
}): Promise<"native-file" | "download-instagram" | "download"> {
  const blob = await fetchMyVeloraCardBlob(input.orderId);
  const file = new File([blob], `MY-VELORA-${input.orderId}.png`, {
    type: "image/png",
  });

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

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `MY-VELORA-${input.orderId}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
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
